exports.codeMessage = (name, copy, code) => {
    return `
        <div style="min-width: 300px;max-width: 500px; margin: 0 auto; border: 1px solid lightgrey; font-family: 'Roboto'; padding: 50px; background: white">
        <img src='https://res.cloudinary.com/internse-app/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1719771519/logo_2_loioba.png' alt='logo' width='20%' style="display: block; margin: 0 auto; border-radius: 60%" />
        <h3 style="line-height: initial; font-weight: 300; font-size: 18px; text-align: center; margin-top: 8px;">POTSEC</h3> 
        \n
        \n <p style="font-size: 18px; font-weight: 500">Hello ${name},</p>
        \n <p style="font-size: 15px">${copy}</p>
        \n
        \n
            <div style="display: block; border-radius: 0px; text-align: center; border: none; padding: 17px; text-decoration: none; background: #dcdcdc; color: black;">
                <h4 style="font-weight: 300; font-size: 24px; margin: 0">${code}</h4>
            </div>
        \n
        </div>
    `
}

exports.registerMessage = (title, copy, code) => {
    return `<div style="min-width: 300px; max-width: 500px; margin: 0 auto; border: 1px solid lightgrey; border-radius: 10px; font-family: 'Google Sans'; padding: 30px; background: white">
    <img src='https://res.cloudinary.com/internse-app/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1719771519/logo_2_loioba.png' alt='logo' width='17%' style="display: block; margin: 0 auto; border-radius: 60%" />
    <h2 style="font-weight: 100; font-size: 18px; text-align: left; margin-bottom: -7px">${title}</h2> 
    \n
    \n <p style="font-size: 15px">${copy}</p>
    \n
    \n
        <div style="margin: 10px 0 10px 0; padding: 10px 20px; text-align: center; background-color: #f7f7f7; border-radius: 8px">
            <p style="font-size: 36px; font-weight: 600; margin: 0">${code}</p>
        </div>
    \n
    \n
        <a style="display: inline-block; cursor: pointer; border: none; border-radius: 5px padding: 10px 17px; text-decoration: none; background: orange; color: white;" 
            href="https://apps.potsec.edu.gh", target="_blank">Login Here
        </a>
    \n
    \n
    <p>That wasn't me! If the above sign-up attempt wasn't you, please ignore this email.</p>
        
    </div>
    `
}

exports.welcomeMessage = (name, index) => {
    return `<div style="min-width: 300px; max-width: 500px; margin: 0 auto; border: 1px solid lightgrey; border-radius: 10px; font-family: 'Google Sans'; padding: 30px; background: white">
    <img src='https://res.cloudinary.com/internse-app/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1719771519/logo_2_loioba.png' alt='logo' width='17%' style="display: block; margin: 0 auto; border-radius: 60%" />
    \n
    \n
    \n <p style="font-size: 15px"><b>Dear ${name},</b></p>
    \n <p style="font-size: 15px">Congratulations! You have been successfully admitted to POTSEC. We are thrilled to welcome you to our institution and look forward to supporting your academic journey.</p>
    \n <p style="font-size: 15px">Your index no. is - <b>${index}</b></p>
    \n <p style="font-size: 15px">Further details regarding your enrollment, orientation, and next steps will be shared shortly. If you have any questions, feel free to contact us at 0247142800</p>
    \n
    \n
    \n
        <p style="font-size: 15px">Welcome again!</p>
        <p style="font-size: 15px">Best regards,</p>
        <p style="font-size: 15px">POTSEC Admissions Office</p>
    \n
    \n  
    </div>
    `
}