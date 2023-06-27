import React from 'react'
import Head from 'next/head'

const Header: React.FC = () => {
    return (
        <Head>
            <title>wit03.xyz</title>
            <link rel="icon" type="image/x-icon" href="/favicon.png" />
            <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        </Head>
    )
}

export default Header