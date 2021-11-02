import React from 'react'

const Footer: React.FC = () => {
  return (
    <footer className='text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900'>
      <div className='container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col'>
        <p className='text-sm text-gray-500 sm:ml-4 sm:pl-4 sm:py-2 sm:mt-0 mt-4'>
          © Jarukit Jintanasathirakul —
          <a
            href='https://github.com/wit03'
            className='text-gray-600 ml-1'
            rel='noopener noreferrer'
            target='_blank'>
            @wit03
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer
