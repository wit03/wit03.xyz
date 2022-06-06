interface educationTypes {
    catagory: string,
    name: string,
    year: string,
    description: string,
    link: string,
    location: string
}

export const educations:educationTypes[] = [
    {
        catagory: "High School",
        name: "Roong Aroon School",
        year: "2006-2022",
        description: "Roong Aroon School is an alternative school that teaching students by project-based learning so we learn lots of thing from project research. I graduated with the GPAX of 3.63",
        link: "http://roong-aroon.ac.th",
        location: "Bangkok, Thailand"
    },
    {
        catagory: "Summmer Course",
        name: "Kwalikum Secondary School",
        year: "2016",
        description: "I spent around 1 month at this school which is located in Qualicum Beach. I was a good exprience for me since I've never been to North America",
        link: "https://www.sd69.bc.ca/school/KSS/Pages/default.aspx",
        location: "BC, Canada"
    },
    {
        catagory: "Bachelor's degree",
        name: "Computer Engineering",
        year: "2022-Now",
        description: 'As my field of interests were pointed towards the computers, I want to study more about the fundamentals and low-level computing. I have recieved a fully-funded "Petchre Pra Jom Klao" scholarship.',
        link: "https://www.sd69.bc.ca/school/KSS/Pages/default.aspx",
        location: "KMUTT, Thailand"
    }
]