import React from 'react'

import 'react-multi-carousel/lib/styles.css'
import '../styles/tailwind.css'

import Hobbies from 'src/components/main/activities'
import Profile from 'src/components/main/profile'
import Projects from 'src/components/main/projects'
import Skills from 'src/components/main/skills'
import Educations from 'src/components/main/educations';


const App: React.FC = () => {
  return (
    <React.Fragment>
      <Profile />
      <Projects />
      <Skills />
      <Educations/>
      <Hobbies />
    </React.Fragment>
  )
}

export default App
