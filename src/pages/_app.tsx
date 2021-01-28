import React from 'react'
import { ThemeProvider } from 'next-themes'

import 'react-multi-carousel/lib/styles.css'
import '../styles/tailwind.css'
import '../styles/custom.css'

const App = ({Component, pageProps}) => {
  return (
    <ThemeProvider attribute="class">
        <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default App
