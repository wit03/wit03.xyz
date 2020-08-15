import React from 'react'
import { educations } from 'src/store/educations'

const Educations: React.FC = () => {
  return (
    <section className='text-gray-700 body-font overflow-hidden'>
      <div className='container px-5 pt-16 pb-24 mx-auto'>
      <h1 className='sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 pb-2'>
              Educations
            </h1>
        <div className='-my-8'>
        {
        educations.map((data) => (
            <div className='py-8 flex flex-wrap md:flex-no-wrap'>
            <div className='md:w-64 md:mb-0 mb-6 flex-shrink-0 flex flex-col'>
              <span className='tracking-widest font-medium title-font text-gray-900'>
                {data.catagory}
              </span>
              <span className='mt-1 text-gray-500 text-sm'>{data.year}</span>
            </div>
            <div className='md:flex-grow'>
              <div className='text-2xl text-gray-900 title-font mb-2 flex flex-row'>
        <h2 className='flex font-medium flex-wrap'>{data.name}<h2 className='text-gray-700 font-thin'>, {data.location}</h2></h2>
              </div>
              <p className='leading-relaxed'>
                {data.description}
              </p>
              <a className='text-indigo-500 inline-flex items-center mt-4'>
                Learn More
                <svg
                  className='w-4 h-4 ml-2'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  stroke-width='2'
                  fill='none'
                  stroke-linecap='round'
                  stroke-linejoin='round'>
                  <path d='M5 12h14'></path>
                  <path d='M12 5l7 7-7 7'></path>
                </svg>
              </a>
            </div>
          </div>
        ))
    }
          
        </div>
      </div>
    </section>
  )
}

export default Educations
