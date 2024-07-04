exports.registerMessage = (title, name, copy, code) => {
    return `
        <div style="min-width: 300px;max-width: 500px; margin: 0 auto; border: 1px solid orange; font-family: 'Google Sans'; padding: 20px; background: white">
        <img src='https://res.cloudinary.com/hiveafrika/image/upload/v1659887796/Assets/HiveAfrica-Logo_htot27.png' alt='logo' width='20%' style="display: block; margin: 0 auto" />
        <h3 style="line-height: initial; font-weight: 300; font-size: 18px; text-align: center; margin-top: 8px;">${title}</h3> 
        <div style="height: 7rem; background-position: top; border-radius: 7px; background-image: url('https://res.cloudinary.com/hiveafrika/image/upload/v1659887218/Assets/colors_mrlpv4.jpg'); background-size: cover;"></div>
        \n
        \n <p style="font-size: 18px; font-weight: 500">Hello ${name},</p>
        \n <p style="font-size: 15px">${copy}</p>
        \n
            <div style="display: block; border-radius: 5px; text-align: center; border: none; padding: 17px; text-decoration: none; background: #dcdcdc; color: black;">
                <h4 style="font-weight: 300; font-size: 24px; margin: 0">${code}</h4>
            </div>
        \n
        \n <h3 style="font-weight: 500; font-size: 20px; margin-bottom: -10px;">That wasn't me!</h3> 
        \n<p style="font-size: 15px">If the above sign-in attempt wasn't you, please <a href='#'>reset your password</a> and enable 2-factor authentication (2FA) as soon as possible to safeguard your account.</p>
        \n
        \n
        </div>
    `
}

exports.loginVerificationMessage = (title, copy) => {
    return `<div style="min-width: 300px;max-width: 500px; margin: 0 auto; border: 1px solid orange; font-family: 'Google Sans'; padding: 20px; background: white">
    <h3 style="font-weight: 100; font-size: 24px">${title}</h3> 
    \n
    \n <p style="font-size: 15px">${copy}</p>
        </div>
    `;
};

exports.genericMessage = (title, name, copy) => {
    return `
        <div style="min-width: 300px;max-width: 500px; margin: 0 auto; border: 1px solid orange; font-family: 'Google Sans'; padding: 20px; background: white">
        <img src='https://res.cloudinary.com/internse-app/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1719771519/logo_2_loioba.png' alt='logo' width='20%' style="display: block; margin: 0 auto" />
        <h3 style="line-height: initial; font-weight: 300; font-size: 18px; text-align: center; margin-top: 8px;">${title}</h3> 
        <div style="height: 7rem; background-position: top; border-radius: 7px; background-image: url('https://res.cloudinary.com/hiveafrika/image/upload/v1659887218/Assets/colors_mrlpv4.jpg'); background-size: cover;"></div>
        \n
        \n <p style="font-size: 18px; font-weight: 500">Hello ${name},</p>
        \n <p style="font-size: 15px">${copy}</p>
        \n
        </div>
    `
}

exports.newUserVerificationMessage = (req, title, copy) => {
    return `<div style="font-family: 'Google Sans'; padding: 20px; background: #dfdfdf;min-width: 300px; max-width: 500px; margin: 0 auto;">
                <div style="background: white">
                    <div style=" padding: 20px; background: #3f5176">
                        <h3 style="font-weight: 100; font-size: 24px; color: white">${title}</h3> 
                    </div>
                    \n
                    <div style=" padding: 20px;">
                        \n <p style="font-size: 15px">${copy}</p>
                        \n
                            <a style="display: inline-block; cursor: pointer; border: none; padding: 17px;text-decoration: none; background: orange; color: white;" 
                            href="https://${req.headers.host}/dashboard" target="_blank">View Client Details</a>
                    </div>

                </div>
            <div>
    `;
};

exports.newAccountCreationMessage = (req, title, copy) => {
    return `<div style="font-family: 'Google Sans'; padding: 20px; background: #dfdfdf;min-width: 300px; max-width: 500px; margin: 0 auto;">
                <div style="background: white">
                    <div style=" padding: 20px; background: #3f5176">
                        <h3 style="font-weight: 100; font-size: 24px; color: white">${title}</h3> 
                    </div>
                    \n
                    <div style=" padding: 20px;">
                        \n <p style="font-size: 15px">${copy}</p>
                        \n
                        
                    </div>

                </div>
            <div>
    `;
};

exports.approvalRequestMessage = (req, title, copy) => {
    return `<div style="font-family: 'Google Sans'; padding: 20px; background: #dfdfdf;min-width: 300px; max-width: 500px; margin: 0 auto;">
                <div style="background: white">
                    <div style=" padding: 20px; background: #3f5176">
                        <h3 style="font-weight: 100; font-size: 24px; color: white">${title}</h3> 
                    </div>
                    \n
                    <div style=" padding: 20px;">
                        \n <p style="font-size: 15px">${copy}</p>
                        \n

                        <a style="display: inline-block; cursor: pointer; border: none; padding: 17px;text-decoration: none; background: orange; color: white;" 
                        href="https://${req.headers.host}/admin/login" target="_blank">Approve Request
                        </a>   
                    </div>

                </div>
            <div>
    `;
};

exports.userApprovalMessage = (req, title, copy) => {
    return `<div style="font-family: 'Google Sans'; padding: 20px; background: #dfdfdf;min-width: 300px; max-width: 500px; margin: 0 auto;">
                <div style="background: white">
                    <div style=" padding: 20px; background: #3f5176">
                        <h3 style="font-weight: 100; font-size: 24px; color: white">${title}</h3> 
                    </div>
                    \n
                    <div style=" padding: 20px;">
                        \n <p style="font-size: 15px">${copy}</p>
                        \n

                        <a style="display: inline-block; cursor: pointer; border: none; padding: 17px;text-decoration: none; background: orange; color: white;" 
                        href="https://${req.headers.host}/auth/login" target="_blank">Get Card Details
                        </a>   
                    </div>

                </div>
            <div>
    `;
};
