interface activityTypes {
    name: String,
    tag: String,
    img: string,
    year: Number,
    description: String
}

export const activity: activityTypes[] = [
    {
        name: "Speaker at React Meetup Thailand 2022",
        tag: "#event",
        img: "13",
        year: 2022,
        description: "I was giving a talk about the value of <React.StrictMode> in the development process of a web app."
    },
    {
        name: "Organizer at Hactoberfest TH 2020",
        tag: "#event",
        img: "11",
        year: 2020,
        description: "As an organizer, I was taking care of Workshop track in the event, and also help others to accomplish their contribution on GitHub"

    },
    {
        name: "1st Runner up on KSCC 2020",
        tag: "#contest",
        img: "1",
        year: 2020,
        description: "KMUTT University's Super Computing contest. I was working with super computer using OMP Library and C/C++ to solve virus infection problems"
    },
    {
        name: "Best Social Innovation in Junior Webmaster Camp 11th",
        tag: "#camp",
        img: "3",
        year: 2019,
        description: "An intensive web camp. I built projects.in.th that helps student to upload their work and get mentorships from professional"
    },
    {
        name: "Young Creators Camp 1",
        tag: "#camp",
        img: "4",
        year: 2019,
        description: "Another intensive camp for building products. I built a toilet finder app named GrabToilet using Progressive Web Application that helps user to find nearby toilets"
    },
    {
        name: "Google Code-in 2019",
        tag: "#event",
        img: "5",
        year: 2019,
        description: "Google Code-in is a contest for pre-university student to contribute to open-source softwares. I have done 3 react.js website for an organization called OpenRMS"
    },
    {
        name: "Speaker at Digital Thailand 2018",
        tag: "#event",
        img: "6",
        year: 2018,
        description: "I talked about my IoT project at home using arduino-based (ESP8266 NodeMCU) with website built by ionic framework and websocket to control the lights and doors. "
    },
    {
        name: "Hactoberfest 2018",
        tag: "#hackathon",
        img: "8",
        year: 2018,
        description: "An online event that helps newbie developer contributing to open-source projects on github. I have done 8 pull requests about web development on random repositories"
    },
    {
        name: "Google I/O Extended 2019",
        tag: "#meetup",
        img: "7",
        year: 2019,
        description: "This is Google I/O meetup organized by Google Development Group Thailand. I learned about new technologies shipped from google such as some new web api."

    },
    {
        name: "Hacktoberfest 2019",
        tag: "#hackathon",
        img: "9",
        year: 2019,
        description: "An online event that helps newbie developer contributing to open-source projects on github. This year I have done 5 pull requests about web developer and I got a t-shirt."
    },
    {
        name: "Stupid Hackathon #3",
        tag: "#hackathon",
        img: "10",
        year: 2019,
        description: "A two days hackathon that participants should build a project that no one needs and just for sake of fun. This is my second hackathon of my life."
    },
    {
        name: "Stupid Hackathon #2",
        tag: "#hackathon",
        img: "2",
        year: 2018,
        description: "A two days hackathon that participants should build a project that no one needs and just for sake of fun. This is my first hackathon of my life."
    },
]