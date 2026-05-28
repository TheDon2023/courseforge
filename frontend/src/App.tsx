import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import CourseDetail from './pages/CourseDetail'
import LessonPlayer from './pages/LessonPlayer'
import OnboardingOverlay from './components/OnboardingOverlay'

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/course/:id" element={<CourseDetail />} />
          <Route path="/app/course/:id/lesson/:lid" element={<LessonPlayer />} />
        </Route>
      </Routes>
      <OnboardingOverlay />
    </>
  )
}
