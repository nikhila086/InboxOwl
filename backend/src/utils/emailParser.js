const parseEmailContent = (email) => {
    // Extract text content from HTML emails
    const stripHtml = (html) => {
        return html
            .replace(/<style[^>]*>.*<\/style>/gs, '')
            .replace(/<script[^>]*>.*<\/script>/gs, '')
            .replace(/<[^>]+>/g, '')
            .replace(/(\r\n|\n|\r)/gm, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const content = {
        text: '',
        html: '',
        attachments: []
    };

    if (email.payload.parts) {
        for (const part of email.payload.parts) {
            switch (part.mimeType) {
                case 'text/plain':
                    content.text = Buffer.from(part.body.data, 'base64').toString();
                    break;
                case 'text/html':
                    content.html = Buffer.from(part.body.data, 'base64').toString();
                    break;
                default:
                    if (part.filename) {
                        content.attachments.push({
                            filename: part.filename,
                            mimeType: part.mimeType,
                            size: part.body.size,
                            attachmentId: part.body.attachmentId
                        });
                    }
            }
        }
    } else if (email.payload.body.data) {
        const data = Buffer.from(email.payload.body.data, 'base64').toString();
        if (email.payload.mimeType === 'text/html') {
            content.html = data;
            content.text = stripHtml(data);
        } else {
            content.text = data;
        }
    }

    return {
        ...content,
        plainText: content.text || stripHtml(content.html)
    };
};

const extractEmailMetadata = (email) => {
    const headers = email.payload.headers;
    const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value;

    return {
        id: email.id,
        threadId: email.threadId,
        from: getHeader('from'),
        to: getHeader('to'),
        subject: getHeader('subject'),
        date: getHeader('date'),
        labelIds: email.labelIds || []
    };
};

module.exports = {
    parseEmailContent,
    extractEmailMetadata
};
