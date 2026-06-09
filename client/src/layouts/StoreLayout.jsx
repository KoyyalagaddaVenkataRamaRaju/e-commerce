import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import Header from '../components/Header'
import TestimonialSpotlight from '../components/TestimonialSpotlight'

export default function StoreLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Outlet />
      </main>
      <TestimonialSpotlight />
      <Footer />
    </div>
  )
}
