import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'

import Modal from '@/components/Modal'
import { TinybirdGenerator } from '@tinybirdco/mockingbird'

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
}

enum HostType {
  EU_GCP = 'eu_gcp',
  US_GCP = 'us_gcp',
  Custom = 'custom',
}

const ENDPOINT_OPTIONS = [
  { label: 'EU (GCP)', value: HostType.EU_GCP },
  { label: 'US (GCP)', value: HostType.US_GCP },
  { label: 'Custom', value: HostType.Custom },
] as const

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter()

  const host = (router.query.host as string | undefined) ?? '',
    token = (router.query.token as string | undefined) ?? '',
    datasource = (router.query.datasource as string | undefined) ?? '',
    eps = parseInt((router.query.eps as string | undefined) ?? '1')
  const defaultHost =
    ENDPOINT_OPTIONS.find(endpoint => endpoint.value === host)?.value ??
    HostType.EU_GCP

  const [error, setError] = useState('')
  const [selectedHost, setSelectedHost] = useState<HostType>(defaultHost)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()

    const values = new FormData(e.target as HTMLFormElement)
    const { datasource, token, eps } = Object.fromEntries(values) as Record<
      string,
      string
    >
    const host = (
      values.get('host') === 'custom'
        ? values.get('endpoint')!
        : values.get('host')!
    ) as string

    try {
      // Validates config
      new TinybirdGenerator({
        datasource,
        endpoint: host,
        token,
        schema: {},
        eps: parseInt(eps),
        limit: -1,
      })

      const urlParams = new URLSearchParams({
        ...router.query,
        host: host.toString(),
        token: token.toString(),
        datasource: datasource.toString(),
        eps: eps.toString(),
      })
      router.push(`?${urlParams}`)
      onClose()
    } catch (e) {
      console.log(e)
      setError('Invalid configuration')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Content>
        <Modal.Title>Settings</Modal.Title>
        <form
          onSubmit={onSubmit}
          className="grid items-center justify-between grid-cols-2 gap-6"
        >
          <label htmlFor="datasource">Data Source</label>
          <input
            id="datasource"
            name="datasource"
            defaultValue={datasource}
            className="input-base"
          />

          <label htmlFor="token">API Token</label>
          <input
            id="token"
            name="token"
            defaultValue={token}
            className="input-base"
          />

          <label htmlFor="host">Host</label>
          <select
            id="host"
            name="host"
            className="input-base"
            value={selectedHost}
            onChange={e => setSelectedHost(e.target.value as HostType)}
          >
            {ENDPOINT_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {selectedHost === HostType.Custom && (
            <>
              <label htmlFor="endpoint">Endpoint</label>
              <input
                id="endpoint"
                name="endpoint"
                defaultValue={
                  defaultHost === HostType.Custom ? host : undefined
                }
                className="input-base"
              />
            </>
          )}

          <label htmlFor="eps">EPS</label>
          <input
            id="eps"
            name="eps"
            defaultValue={eps}
            type="number"
            className="input-base"
          />

          {error.length > 0 && <p className="text-red-500">{error}</p>}

          <button
            type="submit"
            className="col-span-2 text-white btn-base bg-tb-primary"
          >
            Save
          </button>
        </form>
      </Modal.Content>
    </Modal>
  )
}
