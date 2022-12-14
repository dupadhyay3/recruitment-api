import express from "express";
const app = express();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  candidate,
  questions,
  result,
  college,
  admin,
} from "../Modal/modals.js";
import dotenv from "dotenv";
dotenv.config();
import transporter from "../Config/emailconfig.js";

export const adminRegisteration = async (req, res) => {
  const { name, email, password, password_confirmation } = req.body;
  const user = await admin.findOne({ email: email });
  if (user) {
    res.status(404).send({ status: "failed", message: "Email already exists" });
  } else {
    if (name && email && password && password_confirmation) {
      if (password === password_confirmation) {
        try {
          const salt = await bcrypt.genSalt(10);
          const hashPassword = await bcrypt.hash(password, salt);
          const docu = new admin({
            name: name,
            email: email,
            password: hashPassword,
          });
          await docu.save();
          const saved_user = await admin.findOne({ email: email });
          // Generate JWT Token
          const token = jwt.sign(
            { userID: saved_user._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1d" }
          );
          res.status(201).send({
            status: "success",
            message: "Registration Success",
            token: token,
          });
        } catch (error) {
          console.log(error);
          res.send({ status: "failed", message: "Unable to Register" });
        }
      } else {
        res.send({
          status: "failed",
          message: "Password and Confirm Password doesn't match",
        });
      }
    } else {
      res.send({ status: "failed", message: "All fields are required" });
    }
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    if (email && password) {
      const user = await admin.findOne({ email: email });
      if (user != null) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (user.email === email && isMatch) {
          // Generate JWT Token
          const token = jwt.sign(
            { userID: user._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "5d" }
          );
          res.send({
            status: "success",
            message: "Login Success",
            token: token,
          });
        } else {
          res.send({
            status: "failed",
            message: "Email or Password is not Valid",
          });
        }
      } else {
        res.send({
          status: "failed",
          message: "You are not a Registered User",
        });
      }
    } else {
      res.send({ status: "failed", message: "All Fields are Required" });
    }
  } catch (error) {
    console.log(error);
    res.send({ status: "failed", message: "Unable to Login" });
  }
};

export const changeAdminPassword = async (req, res) => {
  const { password, password_confirmation } = req.body.body;
  console.log(req.body);
  console.log("ppppppppppppppp-----------",password);
  if (password && password_confirmation) {
    if (password !== password_confirmation) {
      res.send({
        status: "failed",
        message: "New Password and Confirm New Password doesn't match",
      });
    } else {
      const salt = await bcrypt.genSalt(10);
      const newHashPassword = await bcrypt.hash(password, salt);
      // console.log(req.user,"dfsdfsadfasdf");
      await admin.findByIdAndUpdate(req.user._id, {
        $set: { password: newHashPassword },
      });
      res.send({ status: "success", message: "Password changed succesfully" });
    }
  } else {
    res.send({ status: "failed", message: "All Fields are Required" });
  }
};

export const loggedAdmin = async (req, res) => {
  res.send({ Admin: req.user });
};

export const sendAdminPasswordResetEmail = async (req, res) => {
  const { email } = req.body;
  console.log(req.body);
  if (email) {
    const user = await admin.findOne({ email: email });
    if (user) {
      const secret = user._id + process.env.JWT_SECRET_KEY;
      const token = jwt.sign({ userID: user._id }, secret, {
        expiresIn: "15m",
      });
      const link = `${process.env.SERVER}/management/reset/password/${user._id}/${token}`;
      console.log(link);
      // // Send Email
      let info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Password Reset Link",
        html: `<a href=${link}>Click Here</a> to Reset Your Password`,
      });
      res.send({
        status: "success",
        message: "Password Reset Email Sent... Please Check Your Email",
      });
    } else {
      res.send({ status: "failed", message: "Email doesn't exists" });
    }
  } else {
    res.send({ status: "failed", message: "Email Field is Required" });
  }
};

export const AdminPasswordReset = async (req, res) => {
  const { password, password_confirmation } = req.body;
  console.log(password, password_confirmation, "reqqqqqqqqqqqqqq");
  const { id, token } = req.params;
  console.log(id, "iddddddddddddddd");
  console.log(req.params);
  const user = await admin.findById(id);
  const new_secret = user._id + process.env.JWT_SECRET_KEY;
  try {
    jwt.verify(token, new_secret);
    if (password && password_confirmation) {
      if (password !== password_confirmation) {
        res.send({
          status: "failed",
          message: "New Password and Confirm New Password doesn't match",
        });
      } else {
        const salt = await bcrypt.genSalt(10);
        const newHashPassword = await bcrypt.hash(password, salt);
        await admin.findByIdAndUpdate(user._id, {
          $set: { password: newHashPassword },
        });
        res.send({ status: "success", message: "Password Reset Successfully" });
      }
    } else {
      res.send({ status: "failed", message: "All Fields are Required" });
    }
  } catch (error) {
    console.log(error);
    res.send({ status: "failed", message: "Invalid Token" });
  }
};

/**
 *
 * @param {*} req.body  it will take inputs from frontend
 *
 */

export const createCandidate = async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    dob,
    mobileNo,
    educationDetails,
    areaOfIntrest,
    futureGoal,
    currentAddress,
    collegeName,
    experience,
  } = req.body;
  const user = await candidate.findOne({ email: email });
  console.log(user ,"ddfdf");
  if (user) {
    res.status(404).send({ status: "failed", message: "Email already exists" });
  } else {
    const collegeData = await college.findOne({ collegeName: collegeName });
    let collegeId = collegeData._id;
    const ThisYear = new Date();
    let batch = ThisYear.getFullYear();
    // console.log(collegeData._id,"collegeData");
    if (
      firstName &&
      middleName &&
      lastName &&
      email &&
      dob &&
      mobileNo &&
      educationDetails &&
      areaOfIntrest &&
      futureGoal &&
      currentAddress &&
      collegeName &&
      experience &&
      batch &&
      collegeId
    ) {
      try {
        console.log("insideeeeeeeeeee");

        const doc = new candidate({
          firstName: firstName,
          middleName: middleName,
          lastName: lastName,
          email: email,
          dob: dob,
          mobileNo: mobileNo,
          educationDetails: educationDetails,
          areaOfIntrest: areaOfIntrest,
          futureGoal: futureGoal,
          currentAddress: currentAddress,
          collegeName: collegeName,
          experience: experience,
          batch: batch,
          collegeId: collegeId,
        });
        await doc.save();
        const candi = await candidate.findOne({ email: email });
        let info = await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: process.env.EMAIL_FROM,
          subject: "candidate register",
          html: `<h1>new candidate registered <h1/>`,
        });
        console.log(candi._id, "candidate id");
        res.status(201).send({
          status: "success",
          message: "Registration Success",
          candidateid:candi._id
        });
      } catch (error) {
        console.log(error);
        res.send({ status: "failed", message: "Unable to Register" });
      }
    } else {
      res.send({ status: "failed", message: "All fields are required" });
    }
  }
};
/**
 *
 * @param {*} req
 * @param {*} res
 */

export const getCandidateData = (req, res) => {
  candidate.find(function (err, data) {
    if (err) {
      console.log(err);
    } else {
      res.send(data);
    }
  });
};

export const getCandidateByID = async(req, res) => {
  console.log("hello");
  const id = req.params.id
  
  console.log(id);
  const data= await candidate.findById(id)
  console.log("data",data);
  if(data){
    res.status(201).send(data)
  }
  else{
    res.status(201).send("candidate doesn't exist with this Id")
  }
};

/**
 * 
 changing firstName and currentAddress if firstName is "Lucky"
 */
export const updateQuestion = (req, res) => {
  const { question, options, optionType, ans } = req.body;
  const _id = req.params.id;
  console.log("questionID", _id);
  let myquery = { _id: _id };
  let newvalues = {
    $set: {
      question: question,
      options: options,
      optionType: optionType,
      ans: ans,
    },
  };
  const updateddata = questions.updateOne(
    myquery,
    newvalues,
    function (err, data) {
      if (err) {
        res.send(Error);
        console.log(err);
      } else {
        res.send("one documet updated");
        console.log("Data updated!", updateddata);
      }
    }
  );
};
export const updateCandidateInfo = async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    dob,
    mobileNo,
    collegeName,
    experience,
    currentAddress,
    educationDetails,
    areaOfIntrest,
    futureGoal,
  
  } = req.body;
  const _id = req.params.id;
  console.log("ID", _id);
  const user = await candidate.findOne({ _id: _id });
  if (user) {
    var myquery = { _id: _id };
    var newvalues = {
      $set: {
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        email: email,
        dob: dob,
        mobileNo: mobileNo,
        collegeName: collegeName,
        experience: experience,
        currentAddress: currentAddress,
        educationDetails: educationDetails,
        areaOfIntrest: areaOfIntrest,
        futureGoal: futureGoal,
        
      },
    };
    candidate.updateOne(myquery, newvalues, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        res.status(201).send({
          status: "success",
          message: `${data.modifiedCount} document updated`,
        });
      }
    });
  } else {
    res.status(404).send({
      status: "failed",
      message: `user doesn't exist with this Id`,
    });
  }
};

/**
 deleating documets based on email
 */
export const deleteCandidateInfo = async (req, res) => {
  const { email } = req.body;
  console.log(email);
  const _id = req.params.id;
  console.log("ID", _id);
  const user = await candidate.findOne({ _id: _id });
  if (user) {
    candidate.deleteOne({ _id: _id }, function (err, data) {
      if (err) {
        res.send(err);
      } else {
        res.status(201).send({
          status: "Success",
          message: `${data.deletedCount} document deleted`,
        });
      }
    });
  } else {
    res.status(404).send({
      status: "failed",
      message: `user doesn't exist with this Id`,
    });
  }
};

/**
   * 
creating question 
data will be recived from frontend
*/

export const createQuestion = async (req, res) => {
  const { question, options, optionType, ans } = req.body;

  // (value || query)
  if (question && options && optionType && ans) {
    try {
      const doc = new questions({
        question: question,
        options: options,
        optionType: optionType,
        ans: ans,
      });
      await doc.save();
      res.status(201).send({
        status: "success",
        message: "Question added successfully",
      });
    } catch (error) {
      console.log(error);
      res.send({ status: "failed", message: "Unable to add question" });
    }
  } else {
    res.send({ status: "failed", message: "All fields are required" });
  }
};

/**
 * 
  getting all the questions
 */
export const getQuestionInfo = (req, res) => {
  questions.find(function (err, data) {
    if (err) {
      console.log(err);
    } else {
      res.send(data);
      console.log(data);
    }
  });
};

/**
 * 
 updating question if ans is Ahemdabad
 */


/**
 * 
deleting question if ans is "Ahemdabad"
 */

export const deleteQuestion = async (req, res) => {
  const _id = req.params.id;
  console.log("ID", _id);
  const user = await questions.findOne({ _id: _id });
  if (user) {
    questions.deleteOne({ _id: _id }, function (err, data) {
      if (err) {
        res.send(err);
      } else {
        res.status(201).send({
          status: "Success",
          message: `${data.deletedCount} document deleted`,
        });
      }
    });
  } else {
    res.status(404).send({
      status: "failed",
      message: `user doesn't exist with this mailId`,
    });
  }
};

export const createCollege = async (req, res) => {
  const { collegeName, show } = req.body;
  const user = await college.findOne({ collegeName: collegeName });
  if (user) {
    res.send({ status: "failed", message: "College already exists" });
  } else {
    if (collegeName && show) {
      try {
        const collegeData = new college({
          collegeName: collegeName,
          show: show,
        });
        await collegeData.save();
        res.status(201).send({
          status: "success",
          message: "College Added Successfully",
        });
      } catch (error) {
        console.log(error);
        res.send({ status: "failed", message: "Unable to Add college" });
      }
    } else {
      res.send({ status: "failed", message: "All fields are required" });
    }
  }
};

// export const createCollege = async (req, res) => {
//   const {collegeName,show} = req.body;
//   college
//     .find({ collegeName:collegeName })
//     .then((ans) => {
//       if (ans.length == 0) {
//         let collegeData=new college({
//           collegeName:collegeName,
//           show:show
//         })
//         console.log(collegeData);
//         collegeData
//           .save()
//           .then(() => {
//             res.send("new college added to database");
//           })
//           .catch((err) => {

//             res.send("unable to save to database", err);
//           });
//       } else {
//         res.send("college already exist");
//       }
//     })
//     .catch((err) => {
//       console.log(err,"errr");
//     });
// };

export const getCollegeData = (req, res) => {
  college.find(function (err, data) {
    if (err) {
      console.log(err);
    } else {
      //  let clgName=[]
      //   for(let i=0; i<data.length; i++){
      //     clgName[i]=data[i].collegeName
      //   }
      res.status(201).send(data);
    }
  });
};

export const sendresult = async (req, res) => {
  const date = new Date();
  const testDate = {
    mm: date.getMonth(),
    dd: date.getDate(),
    yy: date.getFullYear().toString().slice(-2),
  };

  const { candidateId, questionAnswer } = req.body;
  const { questionId, ans } = questionAnswer;
  if (candidateId && testDate && questionAnswer) {
    try {
      const docu = new result({
        candidateId: candidateId,
        testDate: testDate,
        questionAnswer: questionAnswer,
      });
      await docu.save();
      res.status(201).send({
        status: "success",
        message: "Submit test successully",
      });
    } catch (err) {
      res.send({ status: "failed", message: "Unable to Register" });
    }
  } else {
    res.send({ status: "failed", message: "All fields are required" });
  }
};

export const getCandidateResult = async (req, res) => {
  const _id = req.params.id;
  // console.log(req.query._id, "QUERY");
  console.log(_id);
  const data = await result.find({ candidateId: _id });
  console.log(data);
  if (data) {
    res.status(201).send(data);
  }
};

export const getAllCandidateResult = async (req, res) => {
  const data = await result.find();
  console.log(data);
  if (data) {
    res.status(201).send(data);
  }
};
export const updateResult = async (req, res) => {
  const { candidateId, questionAnswer } = req.body;
  // console.log(candidateId, questionAnswer);
  // console.log(candidateId,"candidateId");
  const user = await result.find({ candidateId: candidateId });
  // console.log(user, "userrrrrrrrrrrrrrrrrrrr");
  if (user) {
    console.log(user[0].questionAnswer, "---------------");
    console.log(questionAnswer);
    // user[0].questionAnswer
    const newData = questionAnswer;
    //  console.log("newdata",newData);
    var myquery = { candidateId: candidateId };
    var newvalues = {
      $set: {
        questionAnswer: newData,
      },
    };
    result.updateOne(myquery, newvalues, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        res.status(201).send({
          status: "success",
          message: `${data.modifiedCount} document updated`,
        });
      }
    });
  } else {
    res.status(404).send({
      status: "failed",
      message: `user doesn't exist with this Id`,
    });
  }
};

export const randomQuestion = (req, res) => {
  questions.find(function (err, data) {
    if (err) {
      console.log(err);
    } else {
      function shuffleArray(array) {
        let i = array.length - 1;
        for (; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = array[i];
          array[i] = array[j];
          array[j] = temp;
        }
        return array;
      }

      function RecommendedPosts({ posts }) {
        const shuffledPosts = shuffleArray(data);
      }
      res.send(shuffledPosts);
      // console.log(data);
    }
  });
};

export const getSingleQuestion = async (req, res) => {
  console.log("hello");
  const id = req.params.id;

  console.log(id);
  const data = await questions.findById(id);
  console.log("data", data);
  if (data) {
    res.status(201).send(data);
  } else {
    res.status(201).send("candidate doesn't exist with this Id");
  }
};
