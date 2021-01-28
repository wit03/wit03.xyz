import { Mode } from 'fs'
import React, { Fragment } from 'react'
import { useTheme } from 'next-themes'


const ModeToggle: React.FC = () => {
  const [isMounted, setIsMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()
  React.useEffect(() => {
    setIsMounted(true)
  }, [])
  const switchTheme = () => {
    if (isMounted) {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }
  }

  const changeHandler = () => {
    switchTheme()
  }
  return (
    <Fragment>
      <input type='checkbox' id='toggle-mode-cb' onChange={changeHandler}/>

      <div id='mode-wrapper'>
        <label id='toggle-mode' htmlFor='toggle-mode-cb'>
          <span className='sr-only'>Toggle</span>
          <span className='toggle-border'>
            <span id='toggle-indicator'></span>
          </span>
        </label>
      </div>
    </Fragment>
  )
}

export default ModeToggle
