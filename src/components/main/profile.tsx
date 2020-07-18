import react from 'react'
import { ThemeProvider, Box, Flex, Link, Image, Text } from '@chakra-ui/core'

const NavLink = ({ children, ...props }) => (
  <Link px={2} color='white' {...props}>
    {children}
  </Link>
)

const Profile: React.FC = () => {
  return (
    <ThemeProvider>
      <Flex
        bg='white'
        maxW='100%'
        px={5}
        py={4}
        justifyContent='flex-start'
        flexDirection='row'
        alignItems='center'>
        <Image
          src='https://upload.wikimedia.org/wikipedia/commons/a/ab/Android_O_Preview_Logo.png'
          size={30}
        />
        <Box marginLeft='5'>
          <Flex flexDirection='row'>
            <NavLink>
              <Text color='black'>Home</Text>
            </NavLink>
            <NavLink>
              <Text color='black'>About</Text>
            </NavLink>
            <NavLink>
              <Text color='black'>Work</Text>
            </NavLink>
          </Flex>
        </Box>
      </Flex>
    </ThemeProvider>
  )
}

export default Profile
