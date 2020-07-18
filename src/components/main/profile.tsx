import React from 'react'

const Profile: React.FC = () => {
  return (
    <section className='text-gray-700 body-font'>
      <div className='container mx-auto flex px-5 py-24 md:flex-row flex-col items-center'>
        <div className='lg:max-w-lg lg:w-full md:w-1/2 w-5/6 mb-10 md:mb-0'>
          <img
            className='object-cover object-center rounded-full h-600 w-600'
            alt='hero'
            src='https://dummyimage.com/600x600'
          />
        </div>
        <div className='lg:flex-grow md:w-1/2 lg:pl-24 md:pl-16 flex flex-col md:items-start md:text-left items-center text-center'>
          <h1 className='title-font sm:text-4xl text-3xl mb-4 font-medium text-gray-900'>
            Hi, I'm wit03
            <br className='hidden lg:inline-block'>Hi I'm wit03</br>
          </h1>
          <p className='mb-8 leading-relaxed'>
            An ordinary 16 years old software developer. I started coding since I was 11 from building minecraft plug-in. Right now I'm passioness with #WebDevelopment #IoT #Microcontroller and #MachineLearning
          </p>
          <div className='flex justify-center'>
            <button className='inline-flex text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg'>
              Learn More
            </button>
            <button className='ml-4 inline-flex text-gray-700 bg-gray-200 border-0 py-2 px-6 focus:outline-none hover:bg-gray-300 rounded text-lg'>
              PDF CV
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Profile
