interface educationTypes {
    catagory: String,
    name: String,
    year: String,
    description: String,
    link: String 
}

export const educations:educationTypes[] = [
    {
        catagory: "High School",
        name: "Roong Aroon School",
        year: "2006-Now",
        description: "Roong Aroon School is an alternative school that teaching students by project-based learning so we learn lots of thing from project research",
        link: "http://roong-aroon.ac.th"
    },
    {
        catagory: "Summmer Course",
        name: "Kwalikum Secondary School",
        year: "2016",
        description: "I spent around 1 month at this school which is located in Vancouver Island, Canada. I was a good exprience for me since I've never been to North America",
        link: "https://www.sd69.bc.ca/school/KSS/Pages/default.aspx"
    }
]