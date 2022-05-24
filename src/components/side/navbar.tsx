import React from 'react'

const Navbar: React.FC = () => {
    return (
        <nav
            className="
            fixed
          flex flex-wrap 
          items-center
          justify-end
          w-full
          py-4
          md:py-0
          px-4
          text-lg text-gray-700
          bg-white
          bg-opacity-75
        "
        >

            <svg
                xmlns="http://www.w3.org/2000/svg"
                id="menu-button"
                className="h-6 w-6 cursor-pointer md:hidden block"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                />
            </svg>

            <div className="hidden w-full md:flex md:items-center md:w-auto" id="menu">
                <ul
                    className="
              pt-4
              text-base text-gray-700
              md:flex
              md:justify-between 
              md:pt-0"
                >
                    <li>
                        <a className="md:p-4 py-2 block hover:text-indigo-400" href="#"
                        >Blog</a
                        >
                    </li>
                    <li>
                        <a className="md:p-4 py-2 block text-gray-400" href="#"
                        >|</a
                        >
                    </li>
                    <li>
                        <a className="md:p-4 py-2 block hover:text-indigo-400" href="#"
                        >GitHub</a
                        >
                    </li>
                    <li>
                        <a className="md:p-4 py-2 block text-gray-400" href="#"
                        >|</a
                        >
                    </li>
                    <li>
                        <a
                            className="md:p-4 py-2 block hover:text-indigo-400"
                            href="#"
                        >Contact</a
                        >
                    </li>
                </ul>
            </div>
        </nav>
    )

}

export default Navbar