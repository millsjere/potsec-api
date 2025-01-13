const { Document, Page, Text, View, StyleSheet } = require('@react-pdf/renderer');
const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');

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

const AdmissionDocument = ({ student, programme, admissionDate, admission }) => (
    <Document>
        <Page style={styles.page}>
            <Text style={{ height: 1, backgroundColor: '#000', marginBottom: 10 }}></Text>
            <View style={styles.section}>
                <View style={styles.stack}>
                    <Text style={styles.header}>Prince Osei-Tutu Skills and Entrepreneurial College</Text>
                    <Text style={styles.header}>KUMASI, AE-0017-2882 | ACCRA,GW-0117-4851</Text>
                </View>
                <View style={styles.stack}>
                    <Text style={styles.header}>Website: https://potsec.edu.gh</Text>
                    <Text style={styles.header}>TEL: 0247142800 | 0207767777</Text>
                </View>
            </View>
            <Text style={{ height: 1, backgroundColor: '#000', marginBottom: 10 }}></Text>
            <Text style={styles.header}></Text>

            <View style={styles.section}>
                <View style={styles.stack}>
                    <Text style={styles.text}>POTSEC/ADMS/JAN/25</Text>
                    <Text style={styles.text}>NOVEMBER, 28TH, 2024</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.paras}>Date: {admissionDate.date}</Text>
                <Text style={styles.paras}>Student Name: {student.surname} {student.othernames}</Text>
                <Text style={styles.paras}>Index Number: {student.enrollment.index}</Text>
                <Text style={styles.paras}>Location: {student.address.residence}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.text}></Text>
                <Text style={styles.text}>
                    Dear {student.surname},
                </Text>
                <Text style={styles.title}>ADMISSION TO POTSEC – 2025 ACADEMIC YEAR</Text>
                <Text style={styles.text}>
                    1. We are pleased to inform you that the admission board for Prince Osei-Tutu Skills and Entrepreneurial College, Accra Campus has offered you admission to pursue {programme.duration.number} {programme.duration.type} in {programme.name} Programme on {student.enrollment.session} option starting from {admission.startDate}. Our Tuition is 85% practical; you are informed to prepare both in finance and in mind for active participation
                </Text>
                <Text style={styles.text}>
                    2. You are required to make nonrefundable Fees payment of {programme.tuition.words} (GHS {programme.tuition.amount}) before {admission.endDate} if you accept this offer of admission. The Amount covers your Admission Fees and Tuition Fees for the First Semester. Payment must be made at any {admission.bank} Bank branch into the college account {admission.accountNo} all bearing the name PRINCE OSEI-TUTU SKILLS ACQUISITION CENTER, where there is no {admission.bank} bank, you may buy Bankers drafts at any Bank except rural banks or may pay into College MTN Mobile Money account 0549262879 with the name PRINCE OSEI-TUTU. Your Tuition fees for each of the subsequence Semester is GH¢700. Attached is the copy your prospectus
                </Text>
                <Text style={styles.text}>
                    3. Your Hall of affiliation is {student.hallAffiliation}. Note that, the space for accommodation on campus for students is limited. Contact the College administrator on 0247142800 if you wish to be considered for accommodation. {admission.utilities}.
                </Text>
                <Text style={styles.text}>
                    4. The College reserves the right to revise its fees and other arrangements without prior notice, and this letter may be corrected or revoked if a mistake is detected or if it was issued in error
                </Text>
                <Text style={styles.text}>
                    5. Your admission is for the First quarter of 2025 academic year only and if you fail to enroll or withdraw from the program, you forfeit the admission automatically. You will require to complete a fresh set of an application form if you want to be considered for admission in subsequent admissions
                </Text>
                <Text style={styles.text}>
                    6. You will be required to adhere to all College rules and regulations as contained in Students’ Handbooks. Students are considered to be on probation for the duration of their program and they will be dismissed at any time for misconduct without refund
                </Text>
                <Text style={styles.text}>
                    Please, accept our congratulations
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.text}>Yours Sincerely,</Text>
                <Text style={styles.text}></Text>
                <Text style={styles.text}></Text>
                <Text style={styles.text}>Mr. Samuel Darko</Text>
                <Text style={styles.text}>College Principal</Text>
            </View>

            <Text style={styles.footer}>POTSEC: Creating a Skilled World</Text>
        </Page>
    </Document>
);

// Function to generate PDF and send email
const sendAdmissionLetter = async (student, programme, admissionDate, admission) => {
    try {
        // Generate PDF buffer
        const pdfBuffer = await pdf(<AdmissionDocument student={student} programme={programme} admission={admission} admissionDate={admissionDate} />).toBuffer();

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