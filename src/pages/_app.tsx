import React from 'react'

import 'react-multi-carousel/lib/styles.css'
import '../styles/tailwind.css'

import Hobbies from '../components/main/hobbies'
import Profile from '../components/main/profile'
import Projects from '../components/main/projects'
import Skills from '../components/main/skills'

const App: React.FC = () => {
  return (
    <React.Fragment>
      <Profile />
      <Projects />
      <Skills />
      <Hobbies />
    </React.Fragment>
  )
}

export default App
