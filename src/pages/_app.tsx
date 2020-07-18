import React from 'react'
import '../styles/tailwind.css';

import Profile from '../components/main/profile'
import Hobbies from '../components/main/hobbies'
import Projects from '../components/main/projects'

const App:React.FC = () => {
    return(
        <React.Fragment>
            <Profile/>
            <Projects/>
            <Hobbies/>
        </React.Fragment>
    );
}

export default App