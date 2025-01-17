
const sgMail = require('@sendgrid/mail');
const React = require('react');


// Function to generate PDF and send email
const sendAdmissionLetter = async (student, programme, admissionDate, admission) => {
    const { Document, Page, Text, View, StyleSheet, pdf } = await import('@react-pdf/renderer');
    
    // Stylesheet
    const styles = StyleSheet.create({
        page: { padding: 30, fontSize: 12 },
        header: { fontSize: 11, fontWeight: 'extrabold', lineHeight: 0.5 },
        title: { fontSize: 12, textAlign: 'center', marginBottom: 20, fontWeight: 'extrabold', lineHeight: 0.9 },
        section: { marginBottom: 10 },
        text: { marginBottom: 8, lineHeight: 1.2, textAlign: 'justify', fontSize: 11 },
        paras: { marginBottom: 0, lineHeight: 0.9 },
        stack: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
        footer: { marginTop: 30, textAlign: 'center', fontSize: 10 },
    });
    
    // Admission Document Component
    const AdmissionDocument = ({ student, programme, admissionDate, admission }) => (
    
        React.createElement(Document, null,
            React.createElement(Page, { style: styles.page },
                React.createElement(Text, { style: { height: 1, backgroundColor: '#000', marginBottom: 10 } }, ''),
                React.createElement(View, { style: styles.section },
                    React.createElement(View, { style: styles.stack },
                        React.createElement(Text, { style: styles.header }, 'Prince Osei-Tutu Skills and Entrepreneurial College'),
                        React.createElement(Text, { style: styles.header }, 'KUMASI, AE-0017-2882 | ACCRA,GW-0117-4851')
                    ),
                    React.createElement(View, { style: styles.stack },
                        React.createElement(Text, { style: styles.header }, 'Website: https://potsec.edu.gh'),
                        React.createElement(Text, { style: styles.header }, 'TEL: 0247142800 | 0207767777')
                    )
                ),
                React.createElement(Text, { style: { height: 1, backgroundColor: '#000', marginBottom: 10 } }, ''),
                React.createElement(View, { style: styles.section },
                    React.createElement(View, { style: styles.stack },
                        React.createElement(Text, { style: styles.text }, `POTSEC/ADMS/${new Date(admissionDate).toLocaleString('default', { month: 'short' }).toUpperCase()}/${new Date(admissionDate).getFullYear().toString().slice(-2)}`),
                        React.createElement(Text, { style: styles.text }, `Date: ${admissionDate}`)
                    ),
                    React.createElement(Text, { style: styles.paras }, `Student Name: ${student.surname} ${student.othernames}`),
                    React.createElement(Text, { style: styles.paras }, `Index Number: ${student.enrollment.index}`),
                    React.createElement(Text, { style: styles.paras }, `Location: ${student.address.residence}`)
                ),
                React.createElement(View, { style: styles.section },
                    React.createElement(Text, { style: styles.text }, `Dear ${student.surname},`),
                    React.createElement(Text, { style: styles.title }, 'ADMISSION TO POTSEC – 2025 ACADEMIC YEAR'),
                    React.createElement(Text, { style: styles.text },
                        `We are pleased to inform you that you have been admitted to pursue ${programme.duration.number} ${programme.duration.type} in ${programme.name}.`
                    )
                ),
                React.createElement(View, { style: styles.section },
                    React.createElement(Text, { style: styles.text }, 'Yours Sincerely,'),
                    React.createElement(Text, { style: styles.text }, 'Mr. Samuel Darko'),
                    React.createElement(Text, { style: styles.text }, 'College Principal')
                ),
                React.createElement(Text, { style: styles.footer }, 'POTSEC: Creating a Skilled World')
            )
        )
    );
    
    try {
        // Generate PDF buffer
        const doc = React.createElement(AdmissionDocument, { student, programme, admissionDate, admission });
        const pdfBuffer = await pdf(doc).toBuffer();

        // Email content
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: student.email,
            from: 'POTSEC <noreply@potsec.edu.gh>',
            subject: 'Your Admission Letter - POTSEC',
            text: `Dear ${student.surname}, please find your admission letter attached.`,
            attachments: [
                {
                    content: pdfBuffer.toString('base64'),
                    filename: 'Admission_Letter.pdf',
                    type: 'application/pdf',
                    disposition: 'attachment',
                }
            ],
        };

        // Send email
        await sgMail.send(msg);
        console.log('Admission letter sent to', student.email);

    } catch (error) {
        console.error('Error sending admission letter:', error);
    }
};

module.exports = { sendAdmissionLetter };
