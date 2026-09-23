import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { userInfo } from 'node:os'
import { dirname, join, resolve } from 'node:path'

// Development-only cluster. No TCP listener and peer authentication on a private
// socket keep it separate from the machine's existing PostgreSQL service.
if (process.env.NODE_ENV === 'production') {
  throw new Error('Local database commands are disabled in production.')
}
const action = process.argv[2]
if (!['start', 'stop', 'status'].includes(action)) {
  throw new Error('Usage: node scripts/local-db.mjs start|stop|status')
}
const root = resolve(process.env.LOCAL_DB_ROOT ?? '.local/postgres')
const data = join(root, 'data')
const socket = join(root, 'socket')
const config = spawnSync('pg_config', ['--bindir'], { encoding: 'utf8' })
const bin = process.env.PG_BIN ?? config.stdout?.trim()
if (!bin || !existsSync(join(bin, 'initdb'))) {
  throw new Error('Install PostgreSQL 16+ or set PG_BIN to its bin directory.')
}
const run = (command, args, quiet = false) => {
  const result = spawnSync(join(bin, command), args, {
    stdio: quiet ? 'pipe' : 'inherit',
    env: { ...process.env, PGHOST: socket, PGUSER: userInfo().username },
  })
  if (result.error) throw result.error
  return result
}
const running = () => run('pg_ctl', ['-D', data, 'status'], true).status === 0
if (action === 'status') {
  console.log(
    running() ? 'Local PostgreSQL is running.' : 'Local PostgreSQL is stopped.',
  )
} else if (action === 'stop') {
  if (
    running() &&
    run('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']).status !== 0
  ) {
    process.exitCode = 1
  }
} else {
  mkdirSync(root, { recursive: true, mode: 0o700 })
  mkdirSync(socket, { recursive: true, mode: 0o700 })
  if (!existsSync(join(data, 'PG_VERSION'))) {
    if (existsSync(data))
      throw new Error(
        'Existing incomplete cluster; inspect .local/postgres/data before retrying.',
      )
    const initialized = run('initdb', [
      '-D',
      data,
      '--auth-local=peer',
      '--auth-host=reject',
      '--encoding=UTF8',
      '--locale=C.UTF-8',
    ])
    if (initialized.status !== 0) process.exit(initialized.status ?? 1)
  }
  if (!running()) {
    // pg_ctl passes -o through the shell: quote the local path explicitly.
    const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`
    const options = `-k ${quote(socket)} -c listen_addresses='' -c unix_socket_permissions=0700`
    const started = run('pg_ctl', [
      '-D',
      data,
      '-l',
      join(dirname(data), 'server.log'),
      '-o',
      options,
      '-w',
      'start',
    ])
    if (started.status !== 0) process.exit(started.status ?? 1)
  }
  const check = run(
    'psql',
    [
      '-d',
      'postgres',
      '-tAc',
      "SELECT 1 FROM pg_database WHERE datname = 'marketplace_demo'",
    ],
    true,
  )
  if (check.status !== 0) throw new Error('Cannot connect to local PostgreSQL.')
  if (check.stdout.toString().trim() !== '1') {
    const created = run('createdb', ['marketplace_demo'])
    if (created.status !== 0) process.exit(created.status ?? 1)
  }
  console.log('Local PostgreSQL ready: marketplace_demo (private Unix socket).')
}
