import { AppView } from '../../App'
import Header from './Header'
import ChatSidebar from '../chat/ChatSidebar'
import ChatWindow from '../chat/ChatWindow'
import AgentSettingsSidebar from '../chat/AgentSettingsSidebar'
import HealthTimelinePage from '../../pages/HealthTimelinePage'

interface Props {
  view: AppView
  setView: (v: AppView) => void
}

export default function AppShell({ view, setView }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header view={view} setView={setView} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {view === 'chat' ? (
          <>
            <ChatSidebar />
            <ChatWindow />
            <AgentSettingsSidebar />
          </>
        ) : (
          <HealthTimelinePage />
        )}
      </div>
    </div>
  )
}
