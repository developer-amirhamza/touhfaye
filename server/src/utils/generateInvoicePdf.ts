import PDFDocument from 'pdfkit';

interface OrderItem {
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

interface InvoiceData {
    orderNumber: string;
    createdAt: Date | string;
    firstName: string;
    lastName: string;
    orderNote?: string;
    adminNote?: string;
    email: string;
    phone: string;
    shippingAddress: string;
    paymentMethod: string;
    items: OrderItem[];
    subtotal: number;
    shippingCost?: number;
    tax?: number;
    total: number;
}

export const generateInvoicePdf = (data: InvoiceData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const primaryColor = '#2563EB';
        const lightGray = '#F3F4F6';
        const darkGray = '#374151';
        const mutedGray = '#9CA3AF';
        const pageWidth = doc.page.width - 100;

        // Header bar
        doc.rect(50, 40, pageWidth, 70).fill(primaryColor);
        doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
            .text('INVOICE', 60, 60);
        doc.fontSize(10).font('Helvetica')
            .text('Bestiee', 60, 86);
        doc.fillColor('#FFFFFF').fontSize(10)
            .text(`Invoice #${data.orderNumber}`, 400, 60, { align: 'right', width: pageWidth - 350 })
            .text(`Date: ${new Date(data.createdAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}`, 400, 76, { align: 'right', width: pageWidth - 350 });

        // Bill To / Order Info
        doc.moveDown(3);
        const col1X = 50;
        const col2X = 320;
        const sectionY = 130;

        doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold')
            .text('BILL TO', col1X, sectionY);
        doc.fillColor(darkGray).fontSize(10).font('Helvetica-Bold')
            .text(data.firstName, col1X, sectionY + 14)
            .text(data.lastName, col1X, sectionY + 14)
        const orderNoteText = data.orderNote ?? '';
        const adminNoteText = data.adminNote ?? '';

        doc.fillColor(darkGray).fontSize(9).font('Helvetica')
            .text(data.email, col1X, sectionY + 28)
            .text(data.phone, col1X, sectionY + 42)
            .text(orderNoteText || adminNoteText, col1X, sectionY + 42)
            .text(data.shippingAddress, col1X, sectionY + 56, { width: 240 });

        doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold')
            .text('ORDER DETAILS', col2X, sectionY);
        doc.fillColor(darkGray).fontSize(9).font('Helvetica')
            .text(`Order Number:`, col2X, sectionY + 14)
            .text(`Payment Method:`, col2X, sectionY + 28)
            .text(`Status:`, col2X, sectionY + 42);
        doc.fillColor(darkGray).fontSize(9).font('Helvetica-Bold')
            .text(data.orderNumber, col2X + 105, sectionY + 14)
            .text(data.paymentMethod, col2X + 105, sectionY + 28)
            .text('Confirmed', col2X + 105, sectionY + 42);

        // Items table
        const tableTop = sectionY + 100;
        const colWidths = { no: 30, name: 220, qty: 50, price: 80, total: 80 };
        const colX = {
            no: col1X,
            name: col1X + colWidths.no,
            qty: col1X + colWidths.no + colWidths.name,
            price: col1X + colWidths.no + colWidths.name + colWidths.qty,
            total: col1X + colWidths.no + colWidths.name + colWidths.qty + colWidths.price,
        };

        doc.rect(col1X, tableTop, pageWidth, 22).fill(primaryColor);
        doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
        doc.text('#', colX.no, tableTop + 7)
            .text('PRODUCT', colX.name, tableTop + 7)
            .text('QTY', colX.qty, tableTop + 7)
            .text('UNIT PRICE', colX.price, tableTop + 7)
            .text('TOTAL', colX.total, tableTop + 7);

        let rowY = tableTop + 22;
        data.items.forEach((item, i) => {
            const bg = i % 2 === 0 ? '#FFFFFF' : lightGray;
            doc.rect(col1X, rowY, pageWidth, 22).fill(bg);
            doc.fillColor(darkGray).fontSize(9).font('Helvetica');
            doc.text(String(i + 1), colX.no, rowY + 7)
                .text(item.productName, colX.name, rowY + 7, { width: colWidths.name - 10, ellipsis: true })
                .text(String(item.quantity), colX.qty, rowY + 7)
                .text(`$${item.price.toFixed(2)}`, colX.price, rowY + 7)
                .text(`$${item.total.toFixed(2)}`, colX.total, rowY + 7);
            rowY += 22;
        });

        // Totals
        const totalsX = colX.price;
        const totalsWidth = colWidths.price + colWidths.total;
        rowY += 10;

        const addTotalRow = (label: string, value: string, bold = false, highlight = false) => {
            if (highlight) doc.rect(totalsX, rowY, totalsWidth, 22).fill(primaryColor);
            doc.fillColor(highlight ? '#FFFFFF' : darkGray)
                .fontSize(9)
                .font(bold ? 'Helvetica-Bold' : 'Helvetica')
                .text(label, totalsX + 5, rowY + 7)
                .text(value, totalsX + 80, rowY + 7, { align: 'right', width: totalsWidth - 90 });
            rowY += 22;
        };

        addTotalRow('Subtotal', `$${data.subtotal.toFixed(2)}`);
        addTotalRow('Shipping', `$${(data.shippingCost ?? 0).toFixed(2)}`);
        addTotalRow('Tax', `$${(data.tax ?? 0).toFixed(2)}`);
        addTotalRow('TOTAL', `$${data.total.toFixed(2)}`, true, true);

        // Footer
        doc.fillColor(mutedGray).fontSize(8).font('Helvetica')
            .text('Thank you for your order! If you have any questions, please contact hello@mybestiee.com.au', col1X, rowY + 20, { align: 'center', width: pageWidth });

        doc.end();
    });
};