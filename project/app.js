const express = require('express');
const path = require('path');
const bycrpt = require('bcrypt');
const mongoose = require('mongoose');  // Make sure your MongoDB server is running if you're using mongoose
const PORT = 6969;
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const bookStoreUser = require('./model/bookStoreUser');
const BookDetails = require('./model/bookDetails'); // Import the bookDetails model
const session = require('express-session');
const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

// Serve static files from the 'views' folder for both root and /login paths
app.use(express.static(path.join(__dirname, 'views')));

// Serve static files from the 'styles' directory
app.use('/styles', express.static(path.join(__dirname, 'styles')));

// Serve static files from the 'styles' directory
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({
  secret: 'mysession123',  
  resave: false,
  saveUninitialized: true,
}));
//connect database to homepage and retrieve book details
app.get('/', async (req, res) => {
  try {
    // Fetch book details from the database
    const books = await BookDetails.find().sort({ _id: -1 });;
    const user = req.session.user || {};
    console.log(user)
    // Render the index page and pass the fetched books as a variable
    res.render('index', { books, user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//search query
app.get('/search', async (req, res) => {
  try {
    const query = req.query.query;

    // Check if the query is empty
    if (!query) {
      // Display an alert for empty query
      return res.render('search', { books: [], query: '' });
    }

    // Perform the search in the database based on the book name
    const books = await BookDetails.find({ name: { $regex: new RegExp(query, 'i') } });

    // Render the search results page and pass the fetched books as a variable
    res.render('search', { books, query });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


//render to login
app.get('/login', (req, res) => {
  res.render('login'); 
});

//render to search
app.get('/search', (req, res) => {
  res.render('search'); 
});

//render to signup
app.get('/signup', (req, res) => {
  res.render('signup'); 
});

app.get('/admin/index/edit/:id',isAuthenticated, async(req, res) => {
  try {
    const book = await BookDetails.findById(req.params.id);
    res.render('./admin/edit', { book });
} catch (error) {
    res.status(500).json({ error: error.message });
}
});


// // Define a route for /admin/index
// app.get('/admin/index', (req, res) => {
//   res.render('admin/index', { /* additional data if needed */ });
// });


//connection to database
async function connectToDatabase() {
  try {
    // Use the Mongoose connect method as a promise
  await mongoose.connect('mongodb+srv://admin1:Pradeep%401304%3B@crudapi.dprb5cc.mongodb.net/bookStoreUsers');

    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
  }
}

//registering the user into the database
app.post('/signup', async (req,res)=>{
  console.log('Request Body:', req.body);
  try {
    const { firstname, lastname, email , password } = req.body;

    // Create a new student
    const newUser = new bookStoreUser({
      firstname,
      lastname,
      email,
      password,  
    });
    //check if user already exists
    const existingUser  = await bookStoreUser.findOne({email: email})

    if(existingUser){
      res.send('<script>alert("User already exists. Please try with a different email"); window.location.href = "/signup";</script>');
    }else{
      //hash the password
      const saltRounds = 10;
      const hashedPassword = await bycrpt.hash(password,saltRounds);
      newUser.password = hashedPassword;
      await newUser.save();
      res.redirect("login");
    }


   
  }catch(error){
    res.send("Try again"+error);
  }
} )


//login to admin
app.post('/login', async (req, res) => {
  console.log('Login Request Body:', req.body);
  try {
    const { email, password } = req.body;

   
    if (email == "admin@gmail.com" && password == "admin@123") {
      // Redirect to the admin page
      res.redirect("/admin/index");
    } 
else{
     // Check if the credentials match admin credentials
     const check = await bookStoreUser.findOne({email: email})
     if(!check){
       res.send('<script>alert("Username not found"); window.location.href = "/login";</script>');
 
     }
    const isPass = await bycrpt.compare(password , check.password)
    if(isPass){
      req.session.user = {
        email: check.email,
        firstName: check.firstname,  
      };
      res.redirect("/");
    }else {
      // Incorrect password
      res.send('<script>alert("Incorrect password"); window.location.href = "/login";</script>');
    }
  }
  } catch (error) {
    res.send("Try again" + error);
  }
});

// Log  out from the database
app.get('/logout', (req, res) => {
  // Destroy the session to log the user out
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Internal Server Error');
    } else {
      // Redirect to the home page after logout
      res.redirect('/');
    }
  });
});

//this function is use to stop rendering to next page without login using session.
function isAuthenticated(req, res, next) {
  if (req.session.user) {
   
    next();
  } else {
    
    res.redirect('/login');
  }
}
//retieve information in admin panel
app.get('/admin/index',isAuthenticated, async (req, res) => {
  try {
    // Fetch all documents from the bookDetails collection
    const books = await BookDetails.find();

    // Render the index.ejs template with the retrieved data
    res.render('admin/index', { books });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

//insert the book into the database
app.post('/addBook', async (req,res)=>{
  console.log('Request Body:', req.body);
  try {
    const { id, author,name, price, genre, image,quantity } = req.body;

    // Create a new book using the BookDetails model
    const newBook = new BookDetails({
      id,
      name,
      author,
      price,
      genre,
      image,
      quantity
    });
    const existingBook = await BookDetails.findOne({name: name})
    if(existingBook){
      res.send('<script>alert("Book already exists.Enter different book"); window.location.href = "/admin/index";</script>');
    }else{
      // Save the new book to the database
       await newBook.save();
     // Redirect to the admin index page after adding the book
        res.redirect('/admin/index');
    }
   
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
} )


// Edit the book in the database

app.post('/editBook', async (req, res) => {
  const { _id, id, name, author, price, genre, image,quantity } = req.body;
console.log(req.body);
  try {
    const updatedBook = await BookDetails.findByIdAndUpdate(
      _id,
      { id, name, author, price, genre, image,quantity },
      { new: true }
    );

    if (updatedBook) {
      console.log('Book updated successfully:', updatedBook);
      res.redirect("/admin/index"); 
    } else {
      console.log('Book not found or not updated.');
      res.status(404).send('Book not found or not updated.');
    }
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).send('Error updating book: ' + error);
  }
});


//delete entry
app.post('/deleteBook', async (req, res) => {
  const bookId = req.params.id;

  try {
    const deletedBook = await BookDetails.findByIdAndDelete(bookId);

    if (deletedBook) {
      console.log('Book deleted successfully:', deletedBook);
      res.redirect("/admin/index"); // Redirect to a suitable page after deletion
    } else {
      console.log('Book not found or not deleted.');
      res.status(404).send('Book not found or not deleted.');
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).send('Error deleting book: ' + error);
  }
});

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'panja1699@gmail.com', // replace with your email
    pass: 'rdrf kjng bskk fhue', // replace with your email password
  },
});

async function sendEmail(toEmail, bookName, totalPrice) {
  try {
    // Set up email options
    const mailOptions = {
      from: 'panja1699@gmail.com', // replace with your email
      to: toEmail,
      subject: 'Book Purchase Confirmation',
      text: `Thank you for purchasing ${bookName}. Total Price: $${totalPrice}. Your order will be processed shortly.`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Route for handling book purchase
app.get('/buynow',isAuthenticated, async (req, res) => {
  try {
    // Extract book details from the request parameters
    const { itemName, itemPrice, userEmail } = req.query;

    // Find the book in the database based on the itemName
    const purchasedBook = await BookDetails.findOne({ name: itemName });

    if (!purchasedBook) {
      // Handle the case where the book is not found
      return res.status(404).send('Book not found');
    }

    // Check if there is enough quantity available for purchase
    if (purchasedBook.quantity > 0) {
      // Decrement the quantity by 1
      purchasedBook.quantity -= 1;

      // Save the updated book details in the database
      await purchasedBook.save();

      // Perform the purchase operation (e.g., update database, process payment, etc.)
      // For simplicity, we'll just log the purchase details for now.
      console.log(`User ${userEmail} purchased ${itemName} for $${itemPrice}`);

      // Send an email to the user
      await sendEmail(userEmail, itemName, itemPrice);

      // Render a confirmation page (you can customize this page as needed)
      return res.render('confirmation', { itemName, itemPrice, userEmail });
    } else {
      // Handle the case where the quantity is insufficient
      return res.status(400).send('Not enough quantity available for purchase');
    }
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Call the function to connect to the database
connectToDatabase();



app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
