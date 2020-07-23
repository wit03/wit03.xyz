import React from 'react'

import { projects } from '../../store/projects';

const Projects:React.FC = () => {
  return (
    <section className='text-gray-700 body-font'>
      <div className='container px-5 py-24 mx-auto'>
        <div className='flex flex-wrap w-full mb-20 flex-col items-center text-center'>
          <h1 className='sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900'>
            Projects
          </h1>
          <p className='lg:w-1/2 w-full leading-relaxed text-base'>
            I've learn a lot of coding skills through these projects. Some of
            them might just for fun but I think enjoy building stuff is what we
            need to be a good developer.
          </p>
        </div>
        <div className='flex flex-wrap -m-4'>
          {
            projects.map((data) => (
              <div className='xl:w-1/3 md:w-1/2 p-4'>
            <div className='border border-gray-300 p-6 rounded-lg'>
              <span className='inline-block bg-indigo-100 rounded-full px-3 py-1 text-sm font-normal text-indigo-500 mr-2 mb-3'>
                {data.tag}
              </span>

              <h2 className='text-lg text-gray-900 font-medium title-font mb-2'>
                {data.name}
              </h2>
              <p className='leading-relaxed text-base'>
                {data.description}
              </p>
            </div>
          </div>
            ))
          }
        </div>
        <button className='flex mx-auto mt-16 text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg'>
          Button
        </button>
      </div>
    </section>
  )
}

export default Projects
