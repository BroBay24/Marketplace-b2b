import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  addressInputSchema,
  companyInputSchema,
} from '../../src/domain/company-rules'

const company = {
  name: 'PT Sumber Kemasan Jaya',
  responsiblePerson: 'Supplier Demo',
  description: 'Perusahaan fiktif untuk demonstrasi.',
  kind: 'supplier' as const,
  status: 'active' as const,
  city: 'Jakarta',
}

const address = {
  companyId: '10000000-0000-4000-8000-000000000003',
  label: 'Gudang demo',
  recipientName: 'Supplier Demo',
  phone: '+620000000003',
  street: 'Jalan Gudang Demo No. 3',
  city: 'Jakarta',
  province: 'DKI Jakarta',
  postalCode: '10110',
  isDefault: true,
}

describe('company field validation', () => {
  test('accepts canonical company data', () => {
    assert.equal(companyInputSchema.parse(company).kind, 'supplier')
  })

  test('enforces FSD company field boundaries', () => {
    for (const invalid of [
      { ...company, name: 'AB' },
      { ...company, name: 'A'.repeat(121) },
      { ...company, responsiblePerson: 'A' },
      { ...company, responsiblePerson: 'A'.repeat(101) },
      { ...company, description: 'A'.repeat(1_001) },
      { ...company, city: '' },
    ]) {
      assert.equal(companyInputSchema.safeParse(invalid).success, false)
    }
  })
})

describe('address field validation', () => {
  test('accepts canonical address data', () => {
    assert.equal(addressInputSchema.parse(address).postalCode, '10110')
  })

  test('enforces FSD address field boundaries', () => {
    for (const invalid of [
      { ...address, label: 'A' },
      { ...address, label: 'A'.repeat(41) },
      { ...address, recipientName: 'A' },
      { ...address, recipientName: 'A'.repeat(101) },
      { ...address, phone: '1234567' },
      { ...address, phone: '+1234567890123456' },
      { ...address, street: 'Pendek' },
      { ...address, street: 'A'.repeat(251) },
      { ...address, postalCode: '1234A' },
    ]) {
      assert.equal(addressInputSchema.safeParse(invalid).success, false)
    }
  })
})
