import React from 'react'

import Hobbies from 'src/components/main/activities'
import Profile from 'src/components/main/profile'
import Projects from 'src/components/main/projects'
import Skills from 'src/components/main/skills'
import Educations from 'src/components/main/educations'
import Footer from 'src/components/main/footer'
import ModeToggle from 'src/components/side/modeToggle'
import Navbar from 'src/components/side/navbar'

const Home: React.FC = () => {
  return (
    <React.Fragment>
      {/* <Navbar/>
      <ModeToggle /> */}
      <Profile />
      <Projects />
      <Skills />
      <Educations />
      <Hobbies />
      <Footer />
    </React.Fragment>
  )
}

export default Home
