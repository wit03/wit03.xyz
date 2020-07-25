interface Projects {
    name: String,
    tag: String,
    description: String,
    link: string
}

export const projects: Projects[] = [
    {
        name: "Relationship Detector",
        tag: "#web",
        description: "Using machine learning to classify your relation status by picture.",
        link: "https://github.com/wit03/RelationshipDetector"
    },
    {
        name: "Dusit Thani Blog",
        tag: "#web",
        description: "A blog for Dusit Thani Hotel located in Thailand.",
        link: "https://dusitthaniwelove.com"
    },
    {
        name: "Optimized Plotter CNC",
        tag: "#electronics",
        description: "I built a plotter cnc by combined an old CD tray with the magic of Arduino.",
        link: "https://github.com/wit03/optimized-plotter-cnc"
    },
    {
        name: "RA Club Registration System",
        tag: "#web",
        description: "A web-based registration system for my school using React.js and MongoDB.",
        link: "https://github.com/roong-aroon-developer/RA-club-registeration"
    },
    {
        name: "Traffic Jamn't",
        tag: "#hackathon",
        description: "The best way to avoid traffic jam is to run around.",
        link: "https://github.com/EMWPevilCo/traffic-jamnt"
    },
    {
        name: "RA PM2.5",
        tag: "#api",
        description: "PM2.5 Rest API for my school using Express.js and Node.js",
        link: "https://github.com/roong-aroon-developer/Roong-Aroon-PM25-API"
    }

]