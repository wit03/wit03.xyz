import { Mode } from 'fs'
import React, { Fragment } from 'react'
import { useTheme } from 'next-themes'


const ModeToggle: React.FC = () => {
  const [isMounted, setIsMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()
  React.useEffect(() => {
    setIsMounted(true)
    setTheme("light")
  }, [])

  return (
    <Fragment />
  )
}

export default ModeToggle
