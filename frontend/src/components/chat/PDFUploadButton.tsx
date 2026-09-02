import { useRef, useState } from 'react'
import { Paperclip } from 'lucide-react'
import { uploadDocument } from '../../api/documents'
import { useChatStore } from '../../stores/chatStore'

interface Props { chatId: string }

export default function PDFUploadButton({ chatId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const { addDocument } = useChatStore()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const doc = await uploadDocument(chatId, file)
      addDocument(doc)
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Upload medical record PDF"
        style={{
          background: 'none', border: '1px solid var(--glass-border)', borderRadius: 10,
          padding: '8px 10px', cursor: 'pointer', color: uploading ? 'var(--text-muted)' : 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', transition: 'all 0.15s',
        }}
      >
        <Paperclip size={16} />
      </button>
    </>
  )
}
