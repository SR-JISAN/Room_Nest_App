import PDFDocument from "pdfkit";

interface BookingInvoiceData {
  bookingId: string;
  transactionId: string;
  customerName: string;
  customerEmail: string;
  roomName: string;
  occupantCount: number;
  amount: number;
  paymentStatus: string;
  paidAt: Date;
}

const generateBookingInvoice = (data: BookingInvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", reject);

    // Header
    doc.fontSize(26).font("Helvetica-Bold").text("ROOM NEST");

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666666")
      .text("Room Booking & Rental Platform");

    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor("#222222")
      .text("BOOKING INVOICE", 350, 50, {
        width: 195,
        align: "right",
      });

    doc.moveTo(50, 115).lineTo(545, 115).strokeColor("#dddddd").stroke();

    // Payment status
    doc.roundedRect(50, 135, 495, 45, 6).fillColor("#F0FDF4").fill();

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#15803D")
      .text("PAYMENT SUCCESSFUL", 65, 151);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Your room booking has been confirmed.", 280, 151);

    // Customer
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor("#222222")
      .text("Customer Information", 50, 215);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#64748B")
      .text("Name", 50, 245);

    doc
      .font("Helvetica-Bold")
      .fillColor("#222222")
      .text(data.customerName, 50, 262);

    doc.font("Helvetica").fillColor("#64748B").text("Email", 300, 245);

    doc
      .font("Helvetica-Bold")
      .fillColor("#222222")
      .text(data.customerEmail, 300, 262);

    // Booking
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Booking Information", 50, 320);

    doc.roundedRect(50, 350, 495, 150, 6).fillColor("#F8FAFC").fill();

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#64748B")
      .text("Booking ID", 70, 370);

    doc
      .font("Helvetica-Bold")
      .fillColor("#222222")
      .text(data.bookingId, 70, 388);

    doc.font("Helvetica").fillColor("#64748B").text("Room", 300, 370);

    doc
      .font("Helvetica-Bold")
      .fillColor("#222222")
      .text(data.roomName, 300, 388);

    doc.font("Helvetica").fillColor("#64748B").text("Occupants", 70, 430);

    doc
      .font("Helvetica-Bold")
      .fillColor("#222222")
      .text(`${data.occupantCount} Person(s)`, 70, 448);

    doc.font("Helvetica").fillColor("#64748B").text("Booking Status", 300, 430);

    doc.font("Helvetica-Bold").fillColor("#15803D").text("CONFIRMED", 300, 448);

    // Payment
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor("#222222")
      .text("Payment Information", 50, 540);

    doc.roundedRect(50, 570, 495, 130, 6).strokeColor("#E2E8F0").stroke();

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#64748B")
      .text("Payment Method", 70, 592);

    doc.font("Helvetica-Bold").fillColor("#222222").text("bKash", 70, 610);

    doc.font("Helvetica").fillColor("#64748B").text("Transaction ID", 300, 592);

    doc
      .font("Helvetica-Bold")
      .fillColor("#222222")
      .text(data.transactionId, 300, 610);

    doc.font("Helvetica").fillColor("#64748B").text("Payment Status", 70, 650);

    doc
      .font("Helvetica-Bold")
      .fillColor("#15803D")
      .text(data.paymentStatus, 70, 668);

    doc.font("Helvetica").fillColor("#64748B").text("Amount Paid", 300, 650);

    doc
      .fontSize(15)
      .font("Helvetica-Bold")
      .fillColor("#222222")
      .text(`BDT ${data.amount.toFixed(2)}`, 300, 665);

    // Footer
    doc.moveTo(50, 745).lineTo(545, 745).strokeColor("#E2E8F0").stroke();

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#64748B")
      .text("Thank you for choosing Room Nest.", 50, 765, {
        width: 495,
        align: "center",
      });

    doc.end();
  });
};

export default generateBookingInvoice;
