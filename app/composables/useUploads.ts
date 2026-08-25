/**
 * The attachment queue.
 *
 * Files upload the moment they are chosen, not on submit. On a phone a 20 MB
 * scan takes real seconds, and a melder who taps "Versturen" and then watches a
 * spinner for half a minute assumes it hung and leaves. By the time they reach
 * the last step the bytes are already in the bucket.
 *
 * The browser never holds a credential: it asks our server for one presigned
 * PUT per file, scoped to a single key under `intake/`.
 */
import { MAX_FILES, MAX_FILE_BYTES, type AttachmentCategory } from '~/services/contract'

export type UploadState = 'uploading' | 'done' | 'failed'

export interface Upload {
  id: string
  name: string
  size: number
  /** The melder's own label for this file — the strongest signal triage gets. */
  category: AttachmentCategory
  state: UploadState
  progress: number
  /** Object key, only once the PUT succeeded. */
  key?: string
  error?: string
}

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/tiff']

export function humanSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`.replace('.', ',')
}

export function useUploads(submissionId: () => string) {
  const uploads = ref<Upload[]>([])
  const rejected = ref<string[]>([])

  const busy = computed(() => uploads.value.some((u) => u.state === 'uploading'))
  const settled = computed(() => uploads.value.filter((u) => u.state === 'done'))

  function reject(name: string, why: string) {
    rejected.value = [...rejected.value, `${name} — ${why}`]
  }

  async function add(files: FileList | File[], category: AttachmentCategory) {
    for (const file of Array.from(files)) {
      if (uploads.value.length >= MAX_FILES) {
        reject(file.name, `meer dan ${MAX_FILES} bestanden`)
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        reject(file.name, `groter dan ${humanSize(MAX_FILE_BYTES)}`)
        continue
      }
      if (file.size === 0) {
        reject(file.name, 'leeg bestand')
        continue
      }
      // Phones hand over HEIC with an empty type often enough that a strict
      // check here would reject a photo the melder just took.
      if (file.type && !ACCEPTED.includes(file.type)) {
        reject(file.name, 'geen PDF of foto')
        continue
      }

      const entry = reactive<Upload>({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        category,
        state: 'uploading',
        progress: 0,
      })
      uploads.value = [...uploads.value, entry]
      void send(entry, file)
    }
  }

  async function send(entry: Upload, file: File) {
    try {
      const grant = await $fetch<{ url: string; key: string }>('/api/upload-url', {
        method: 'POST',
        body: {
          submissionId: submissionId(),
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
        },
      })
      await put(grant.url, file, (p) => (entry.progress = p))
      entry.key = grant.key
      entry.state = 'done'
      entry.progress = 1
    } catch {
      entry.state = 'failed'
      entry.error = 'Uploaden is niet gelukt'
    }
  }

  /** XHR rather than fetch, purely because it reports upload progress. */
  function put(url: string, file: File, onProgress: (p: number) => void) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', url, true)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))))
      xhr.onerror = () => reject(new Error('network'))
      xhr.send(file)
    })
  }

  function remove(id: string) {
    uploads.value = uploads.value.filter((u) => u.id !== id)
  }

  function retry(id: string) {
    // The File is gone once dropped, so a failed upload is removed and the
    // melder picks it again. Honest, and shorter than holding blobs in memory.
    remove(id)
  }

  function dismiss(index: number) {
    rejected.value = rejected.value.filter((_, i) => i !== index)
  }

  return { uploads, rejected, busy, settled, add, remove, retry, dismiss }
}
