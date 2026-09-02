import Header from './Header'
import ChatSidebar from '../chat/ChatSidebar'
import ChatWindow from '../chat/ChatWindow'
import AgentSettingsSidebar from '../chat/AgentSettingsSidebar'

export default function AppShell() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ChatSidebar />
        <ChatWindow />
        <AgentSettingsSidebar />
      </div>
    </div>
  )
}
