import React from 'react'

const Footer: React.FC = () => {
  return (
    <footer className='text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900'>
      <div className='container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col'>
        <a className="flex title-font font-medium items-center md:justify-start justify-center text-gray-900" href="https://webring.wonderful.software#YOUR.DOMAIN" title="วงแหวนเว็บ">

          <svg width="32" height="32" viewBox="0 0 416 416" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M53 128.8l-16-8.2a192 192 0 1094.7-88.9l7.1 16.6A174 174 0 1153 128.8z" fill="#718096" />
            <path d="M94.7 92.3L82 126.5 62.6 95.7l-36.4-1.4 23.3-28-9.9-35.1 33.9 13.5 30.3-20.3-2.4 36.4L130 83.3l-35.3 9z" fill="#667EEA" />
          </svg>

        </a>
        <p className="text-sm text-gray-500 sm:ml-4 sm:pl-4 sm:border-l-2 sm:border-gray-200 sm:py-2 sm:mt-0 mt-4">
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
