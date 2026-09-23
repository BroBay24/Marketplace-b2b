export function assertDemoSeedAllowed(
  environment: NodeJS.ProcessEnv = process.env,
) {
  if (environment.NODE_ENV === 'production') {
    throw new Error('Demo seed is disabled in production.')
  }
  if (environment.DATABASE_URL && environment.ALLOW_DEMO_SEED !== 'true') {
    throw new Error(
      'Set ALLOW_DEMO_SEED=true to seed an explicitly configured database.',
    )
  }
}
