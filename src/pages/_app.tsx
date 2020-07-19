import React from 'react'
import '../styles/tailwind.css'
import "react-multi-carousel/lib/styles.css";

import Profile from '../components/main/profile'
import Hobbies from '../components/main/hobbies'
import Skills from '../components/main/skills'
import Projects from '../components/main/projects'

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
