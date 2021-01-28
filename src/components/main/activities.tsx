import React from 'react'
import Carousel from 'react-multi-carousel'

import { activity } from 'src/store/activities'

const responsive = {
  largeDesktop: {
    breakpoint: { max: 3000, min: 1280 },
    items: 3,
    slidesToSlide: 3, // optional, default to 1.
  },
  tablet: {
    breakpoint: { max: 1280, min: 640 },
    items: 2,
    slidesToSlide: 1, // optional, default to 1.
  },
  mobile: {
    breakpoint: { max: 640, min: 0 },
    items: 1,
    slidesToSlide: 1, // optional, default to 1.
  },
}

const Hobbies: React.FC = () => {
  const jpeg = "1"
  return (
    <section className='text-gray-700 body-font dark:text-gray-400 dark:bg-gray-900'>
      <div className='container px-5 py-24 mx-auto'>
        <div className='flex flex-wrap w-full mb-20'>
          <div className='lg:w-1/2 w-full mb-6 lg:mb-0'>
            <h1 className='sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white'>
              Activities
            </h1>
            <div className='h-1 w-20 bg-indigo-500 rounded' />
          </div>
          <p className='lg:w-1/2 w-full leading-relaxed text-base dark:text-gray-400'>
            I've joined tons of both offline and online event, contest, meetup and hackathon about coding.
          </p>
        </div>
        <Carousel
          swipeable={true}
          draggable={true}
          showDots={true}
          arrows={false}
          responsive={responsive}
          focusOnSelect={true}
          containerClass='pb-8'>
          {activity.map((data, i) => (
            <div className='xl:w-5/6 md:w-5/6 p-4' key={i}>
              <div className='bg-gray-100 p-6 rounded-xl mx-auto dark:bg-gray-800'>
                <picture>
                  <source srcSet={require(`public/img/activity/${data.img}.jpg?webp`)} type="image/webp" />
                  <source srcSet={require(`public/img/activity/${data.img}.jpg`)} type="image/jpeg" />
                  <img
                  className='h-auto rounded w-full object-cover object-center mb-6'
                  src={require(`public/img/activity/${data.img}.jpg`)}
                  loading='lazy'
                  alt='content'
                />           
                </picture>
                
                <h3 className='tracking-widest text-indigo-500 text-xs font-medium title-font dark:text-indigo-400'>
                  {data.tag}
                </h3>
                <h2 className='text-lg text-gray-900 font-medium title-font mb-4 dark:text-white'>
                  {data.name}
                </h2>
                <p className='leading-relaxed text-base'>{data.description}</p>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  )
}

export default Hobbies
