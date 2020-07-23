import React from 'react'

import 'react-multi-carousel/lib/styles.css'
import '../styles/tailwind.css'

import Education from '../components/main/educations';
import Hobbies from '../components/main/activities'
import Profile from '../components/main/profile'
import Projects from '../components/main/projects'
import Skills from '../components/main/skills'
import Educations from '../components/main/educations';


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
