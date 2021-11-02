import React from 'react'

import { skills } from 'src/store/skills'

const Skills: React.FC = () => {
  return (
    <section className='text-gray-700 body-font dark:text-gray-400 dark:bg-gray-900'>
      <div className='container flex flex-wrap px-5 py-24 mx-auto items-center'>
        <div className='md:w-1/2 md:pr-12 md:py-8 md:border-r md:border-b-0 mb-10 md:mb-0 pb-10 border-b border-gray-300 dark:border-gray-800'>
          <h1 className='sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white'>
            Skills
          </h1>
          <p className='leading-relaxed text-base'>
            Since grade five, i have been spending my time on my interested fields such as Web Development, Machine Learning, Compeititive Programming, and I have learn a lot throughout my time.
          </p>
        </div>
        <div className='flex flex-col md:w-1/2 md:pl-12'>
          <h2 className='title-font font-medium text-gray-800 tracking-widest text-sm mb-3 dark:text-white'>
            Technicals
          </h2>
          <nav className='flex flex-wrap list-none -mb-1'>
            {skills.map((data, i) => (
              <li className='lg:w-1/3 mb-1 w-1/2' key={i}>
                <a className='text-gray-600 hover:text-gray-800 dark:hover:text-white'>{data}</a>
              </li>
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}

export default Skills
