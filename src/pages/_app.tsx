import React from 'react'
import '../styles/tailwind.css';

import Profile from '../components/main/profile'
import Hobbies from '../components/main/hobbies'

const App:React.FC = () => {
    return(
        <React.Fragment>
            <Profile/>
            <Hobbies/>
        </React.Fragment>
    );
}

export default App