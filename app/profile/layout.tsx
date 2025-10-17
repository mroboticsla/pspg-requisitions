import Header from '../components/Header'
import Sidebar from '../components/navigation/Sidebar'
import MainContent from '../components/MainContent'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-secondary overflow-x-hidden">
      <Header showNavigation={true} />
      <Sidebar />
      <MainContent>
        {children}
      </MainContent>
    </div>
  )
}
