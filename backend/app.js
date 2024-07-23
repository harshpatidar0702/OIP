const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');


app.use(cors());
app.use(express.json());

const upload = multer({
  limits: {
    fileSize: 15 * 1024 * 1024, 
  },
});


mongoose.connect('mongodb://localhost:27017/imsdb', {useNewUrlParser: true , useUnifiedTopology:true});
const userSchema = new mongoose.Schema({
    name : String,
    number : String , 
    email : String,
    gender : String,
    password : String,
    role :{
        type : String,
        enum : ['user' , 'admin'],
        default: 'user'
    }

},{ timestamps: true });


const userModule = mongoose.model("user",userSchema);


const Add_category = new mongoose.Schema({
    category_name: {
        type: String,
    },
    date: {
        type: String,
    },
    subcategories: [{
        name: {
            type: String,
        },
        date: {
            type: String,
        }
    }]
});
const categoryModule = mongoose.model("Add_category",Add_category);


const policySchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category' 
    },
    subcategory: {
        type: String, 
        required: true
    },
    policyName: {
        type: String,
    },
    sumAssured: {
        type: String,
    },
    premium: {
        type: String,
    },
    tenure: {
        type: String,
    },
    maturityAmount: {
        type: String,
    },
    premiumPerMonth: { 
        type: String,
    },
    creationDate: {
        type: String,
    }
});
const PolicyModule = mongoose.model('Policy', policySchema);

const adminSchema = new mongoose.Schema({
    adminUsername : {
        type:String,
        unique : true,
    },
    password: String , 
});


const policyHolderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    policy: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy' },
    policyNumber: { type: String, required: true },
    aadharCard: { type: String }, 
    photo: { type: String }, 
    proofOfAge: { type: String }, 
    proofOfIdentity: { type: String }, 
    applyDate: { type: Date, default: Date.now },
    deleted :{type: Boolean,default: false }
});
const PolicyHolder = mongoose.model('PolicyHolder', policyHolderSchema);

const policyClamSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    policyNumber: { type: String, required: true },
    policyDocument: { type: String }, 
    bankPassbook: { type: String }, 
    description: { type: String },  
    applyDate: { type: Date, default: Date.now },
    deleted :{type: Boolean,default: false },
    status: { type: String, default: 'Waiting for Approval' } 

});
const PolicyClam = mongoose.model('PolicyClam', policyClamSchema);



const PolicyStatusSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    policyName: {
        type: String,
        required: true
    },
    policyNumber: {
        type: String,
        required: true
    },
    categoryName: {
        type: String,
        required: true
    },
    subcategoryName: {
        type: String,
        required: true
    },
    sumAssured: {
        type: String
    },
    tenure: {
        type: String
    },
    applyDate: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Disapproved'],
        default: 'Pending'
    }
});

const PolicyStatus = mongoose.model('PolicyStatus', PolicyStatusSchema);

const ticketSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  issue: {
    type: String,
    enum: ['payment', 'technical', 'other','Claim Policy'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  admin_remark: {
    type: String,
    default: null
  },
  admin_remark_updated_at: {
    type: Date,
    default: null
  }
});

const Ticket = mongoose.model('Ticket', ticketSchema);




const adminModule = mongoose.model("admin",adminSchema);
const test = new adminModule({
    adminUsername : "Harsh",
    password : "ADMIN",
});

test.save()
    .then(savedTest => console.log("Record created : ",savedTest))
    .catch(saveErr => console.error('error', saveErr));

const uploadFields = upload.fields([
  { name: 'aadharCard', maxCount: 1 }, 
  { name: 'photo', maxCount: 1 },
  { name: 'proofOfAge', maxCount: 1 },
  { name: 'proofOfIdentity', maxCount: 1 },
]);


app.post('/applyPolicy', uploadFields, async (req, res) => {
    const { userId, policyId, policyNumber } = req.body;
    const { aadharCard, photo, proofOfAge, proofOfIdentity } = req.files;
    try {
        const aadharCardBase64 = aadharCard[0].buffer.toString('base64');
        const photoBase64 = photo[0].buffer.toString('base64');
        const proofOfAgeBase64 = proofOfAge[0].buffer.toString('base64');
        const proofOfIdentityBase64 = proofOfIdentity[0].buffer.toString('base64');

        const policyHolder = new PolicyHolder({
            user: userId,
            policy: policyId,
            policyNumber: policyNumber,
            aadharCard: aadharCardBase64, 
            photo: photoBase64, 
            proofOfAge: proofOfAgeBase64, 
            proofOfIdentity: proofOfIdentityBase64, 
            applyDate: new Date() 
        });

        await policyHolder.save();

        res.status(201).json({ message: 'Policy applied successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const uploadClam = upload.fields([
  { name: 'policyDocument', maxCount: 1 }, 
  { name: 'bankPassbook', maxCount: 1 },
]);

app.post('/Clam', uploadClam, async (req, res) => {
    const { userId, policyNumber, description } = req.body; // Include userId
    const policyDocument = req.files.policyDocument ? req.files.policyDocument[0] : null;
    const bankPassbook = req.files.bankPassbook ? req.files.bankPassbook[0] : null;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    try {
        const policyDocumentBase64 = policyDocument ? policyDocument.buffer.toString('base64') : null;
        const bankPassbookBase64 = bankPassbook ? bankPassbook.buffer.toString('base64') : null;

        const newClaim = new PolicyClam({
            user: userId,
            policyNumber: policyNumber,
            policyDocument: policyDocumentBase64, 
            bankPassbook: bankPassbookBase64, 
            description: description,
            applyDate: new Date() // This is already default, so you could omit setting it explicitly.
        });

        await newClaim.save();
        res.status(201).json({ message: 'Policy claim applied successfully', claimId: newClaim._id });
    } catch (error) {
        console.error('Failed to process claim:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

app.post('/genrate_tickets', async (req, res) => {
  try {
    const { userId, subject, issue, description, admin_remark } = req.body;

    const ticketData = {
      userId,
      subject,
      issue,
      description,
      admin_remark: admin_remark || null 
    };

    const ticket = new Ticket(ticketData);

    await ticket.save();

    res.status(201).json({ message: 'Ticket created successfully!' });
  } catch (error) {
    console.error('Failed to create ticket:', error);
    res.status(500).json({ message: 'Failed to create ticket. Please try again.' });
  }
});


app.post('/genrate_tickets/:id/add_remark', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemark } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { 
        admin_remark: adminRemark,
        admin_remark_updated_at: new Date()
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Failed to add admin remark:', error);
    res.status(500).json({ message: 'Failed to add admin remark.' });
  }
});


app.post('/PolicyStatus', async (req, res) => {
    const { userId, policyName, policyNumber, categoryName, subcategoryName, sumAssured, tenure, applyDate, status } = req.body;

    try {
        const policyStatus = new PolicyStatus({
            user: userId,
            policyName: policyName,
            policyNumber: policyNumber,
            categoryName: categoryName,
            subcategoryName: subcategoryName,
            sumAssured: sumAssured,
            tenure: tenure,
            applyDate: applyDate,
            status: status
        });
        await policyStatus.save();
        res.status(201).json({ message: 'Policy status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/Addpolicy', async (req, res) => {
  try {
    const { category, subcategory, policyName, sumAssured, premium, tenure, maturityAmount, premiumPerMonth, creationDate } = req.body;

    const newPolicy = new PolicyModule({
      category: category, 
      subcategory: subcategory,
      policyName: policyName,
      sumAssured: sumAssured,
      premium: premium,
      tenure: tenure,
      maturityAmount: maturityAmount,
      premiumPerMonth: premiumPerMonth, 
      creationDate: creationDate
    });
    await newPolicy.save();

    res.status(201).json({ message: "Policy added successfully", policy: newPolicy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post('/AddSubCategory', async (req, res) => {
    try {
        const { categoryId, subcategoryName, date } = req.body;

        const category = await categoryModule.findById(categoryId);
        category.subcategories.push({ name: subcategoryName, date: date });
        await category.save();

        res.status(201).json({ message: "Subcategory added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/genrate_tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    res.json(ticket);
  } catch (error) {
    console.error('Failed to retrieve ticket:', error);
    res.status(500).json({ message: 'Failed to retrieve ticket.' });
  }
});

app.get('/Clam', async (req, res) => {
    try {
        const claims = await PolicyClam.find();
        res.status(200).json(claims);
    } catch (error) {
        console.error('Failed to retrieve claims:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

app.get('/Clam/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const claims = await PolicyClam.find({ user: userId });
        res.json(claims);
    } catch (error) {
        console.error('Failed to fetch claims:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


app.get('/genrate_tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find();
    res.json(tickets); 
  } catch (error) {
    console.error('Failed to retrieve tickets:', error);
    res.status(500).json({ message: 'Failed to retrieve tickets.' });
  }
});


app.get("/", async (req, res) => {
    userModule.find({})
    .then(login=>res.json(login))
    .catch(err=>res.json(err))
});


app.get('/Addpolicy', async (req, res) => {
  try {
        const data = await PolicyModule.find();
        res.json(data);
    } catch (err) {
        res.json({ error: "Error" });
    }
});    

app.get('/applyPolicy', async (req, res) => {
  try {
        const data = await PolicyHolder.find();
        res.json(data);
    } catch (err) {
        res.json({ error: "Error" });
    }
});  

app.get('/PolicyStatus', async (req, res) => {
  try {
        const data = await PolicyStatus.find();
        res.json(data);
    } catch (err) {
        res.json({ error: "Error" });
    }
});  


app.get("/Admin", async (req, res) => {
    try {
        const data = await adminModule.find();
        res.json(data);
    } catch (err) {
        res.json({ error: "Error" });
    }
});

app.get('/Usersignup', async (req, res) => {
    try {
        const { name, number, email, gender, password, role } = req.query;
        const newUser = new userModule({
            name,
            number,
            email,
            gender,
            password,
            role
        });
        await newUser.save();
        res.json(newUser);
    } catch (err) {
        res.status(500).json({ error: "Error" });
    }
});

app.get("/getLogin/:id", (req, res)=>{
    const id = req.params.id;
    userModule.findById({_id:id})
    .then(login=>res.json(login))
    .catch(err=>res.json(err))
})

app.get("/AddCategory/:id", (req, res)=>{
    const id = req.params.id;
    categoryModule.findById({_id:id})
   .then(add_category=>res.json(add_category))
    .catch(err=>res.json(err))
})

app.post('/Usersignup', async (req, res) => {
    try {
        console.log(req.body);
        const newlogin = new userModule(req.body);
        await newlogin.save();
        res.json(newlogin);
    } catch (err) {
        res.json({ error: "Error" });
    }
});

app.get("/AddCategory", async (req, res) => {
    try {
        const data = await categoryModule.find();
        res.json(data);
    } catch (err) {
        res.json({ error: "Error" });
    }
});


app.post('/AddCategory', async (req, res) => {
  try {
    const { category, date } = req.body;
    await categoryModule.create({ 
      category_name: category, 
      date: date
    });
    res.status(201).json({ message: "Category added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.post('/admin/signup', async (req, res) => {
    try {
        const newAdmin = new adminModule(req.body);
        await newAdmin.save();
        res.json(newAdmin);
    } catch (err) {
        res.json({ error: "Error" });
    }
});

app.delete('/Usersignup/:id', async (req, res) => {
    try {
        await userModule.findByIdAndRemove(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.json({ error: "Error" });
    }
});

app.delete('/deleteSubcategory/:categoryId/:subcategoryId', async (req, res) => {
    const categoryId = req.params.categoryId;
    const subcategoryId = req.params.subcategoryId;

    try {
        const category = await Category.findById(categoryId);

        if (category) {
            const subcategory = category.subcategories.id(subcategoryId);
            if (subcategory) {
                subcategory.remove();
                await category.save();
                res.status(200).json({ message: 'Subcategory deleted successfully' });
            } else {
                res.status(404).json({ error: 'Subcategory not found' });
            }
        } else {
            res.status(404).json({ error: 'Category not found' });
        }
    } catch (error) {
        console.error('Error deleting subcategory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.put('/updateusers/:id', async (req, res) => {
  try {
    const updatedUser = await userModule.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    res.send(updatedUser);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.put('/deleteLogin/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const softDeletedLogin = await userModule.findByIdAndUpdate(
            id,
            { $set: { deleted: true } },
            { new: true }
        );

        if (!softDeletedLogin) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json(softDeletedLogin);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.put("/updatecategory/:id", (req, res)=>{
    const id = req.params.id;
    categoryModule.findByIdAndUpdate({_id:id},{
        category_name:req.body.category_name,
    })
    .then(add_category=>res.json(add_category))
    .catch(err=>res.json(err))
})


app.put("/updateSubcategory/:subcategoryId", (req, res) => {
    const subcategoryId = req.params.subcategoryId;
    const newName = req.body.name;

    categoryModule.find()
        .then(categories => {
            if (!categories || categories.length === 0) {
                return res.status(404).json({ error: "No categories found" });
            }

            categories.forEach(category => {
                const subcategory = category.subcategories.find(sub => sub._id.toString() === subcategoryId);
                if (subcategory) {
                    subcategory.name = newName;
                }
            });

            return Promise.all(categories.map(category => category.save()));
        })
        .then(updatedCategories => res.json(updatedCategories))
        .catch(err => res.status(500).json({ error: err.message }));
});

app.put("/UpdatePolicy/:policyId", (req, res) => {
    const id = req.params.policyId; 
    const updatedPolicyData = {
        policyName: req.body.policyName,
        // category: req.body.category,
        // subcategory: req.body.subcategory,
        sumAssured: req.body.sumAssured,
        premium: req.body.premium,
        tenure: req.body.tenure
    };

    PolicyModule.findByIdAndUpdate(id, updatedPolicyData, { new: true })
        .then(updatedPolicy => {
            if (updatedPolicy) {
                res.json(updatedPolicy); 
            } else {
                res.status(404).json({ message: "Policy not found" });
            }
        })
        .catch(err => res.status(500).json({ error: err.message }));
});


app.put('/applyPolicy/:id', async (req, res) => {
    const policyId = req.params.id;
    const { deleted, status } = req.body;

    try {
        const updatedPolicy = await PolicyHolder.findByIdAndUpdate(
            policyId,
            { deleted: deleted, status: status },
            { new: true } 
        );

        if (!updatedPolicy) {
            return res.status(404).json({ message: 'Policy not found' });
        }

        res.status(200).json(updatedPolicy);
    } catch (error) {
        console.error('Error updating policy:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/Clam/:policyNumber', async (req, res) => {
    const { policyNumber } = req.params;
    const { status, deleted } = req.body;

    try {
        const updatedClaim = await PolicyClam.findOneAndUpdate(
            { policyNumber: policyNumber },
            { status: status, deleted: deleted },
            { new: true } 
        );

        if (!updatedClaim) {
            return res.status(404).json({ message: 'Claim not found with provided policy number' });
        }

        res.json({ message: 'Policy claim updated successfully', updatedClaim });
    } catch (error) {
        console.error('Failed to update claim:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});






app.listen(1000);
