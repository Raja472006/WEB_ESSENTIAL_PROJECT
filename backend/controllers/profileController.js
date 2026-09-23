const db = require('../config/database');

function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) {
    return {
      bmi: null,
      category: 'Not Available',
      badgeClass: 'badge-secondary',
      description: 'Enter your height and weight to calculate your BMI.'
    };
  }

  const heightM = heightCm / 100;
  const bmiValue = weightKg / (heightM * heightM);
  const bmi = Math.round(bmiValue * 10) / 10;

  let category = 'Normal';
  let badgeClass = 'badge-success';
  let description = 'You have a healthy body weight. Maintain your balanced nutrition!';

  if (bmi < 18.5) {
    category = 'Underweight';
    badgeClass = 'badge-warning';
    description = 'You are currently underweight. Consider increasing calorie and protein intake.';
  } else if (bmi >= 18.5 && bmi < 25) {
    category = 'Normal';
    badgeClass = 'badge-success';
    description = 'You have a healthy body weight. Keep up your active lifestyle and nutritious diet!';
  } else if (bmi >= 25 && bmi < 30) {
    category = 'Overweight';
    badgeClass = 'badge-warning';
    description = 'You are in the overweight range. Regular exercise and mindful portions are advised.';
  } else {
    category = 'Obesity';
    badgeClass = 'badge-danger';
    description = 'You are in the obesity range. Consult a healthcare provider for personalized guidance.';
  }

  return { bmi, category, badgeClass, description };
}

// GET /api/profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      'SELECT id, full_name, email, age, gender, height, weight, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = rows[0];
    const bmiData = calculateBMI(user.weight, user.height);

    return res.json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        created_at: user.created_at
      },
      bmiData
    });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

// PUT /api/profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, age, gender, height, weight } = req.body;

    const userAge = age !== undefined && age !== '' ? parseInt(age, 10) : null;
    const userHeight = height !== undefined && height !== '' ? parseFloat(height) : null;
    const userWeight = weight !== undefined && weight !== '' ? parseFloat(weight) : null;
    const userGender = gender || null;

    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Full name cannot be blank.' });
    }

    await db.query(
      `UPDATE users
       SET full_name = ?, age = ?, gender = ?, height = ?, weight = ?
       WHERE id = ?`,
      [full_name.trim(), userAge, userGender, userHeight, userWeight, userId]
    );

    const bmiData = calculateBMI(userWeight, userHeight);

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: userId,
        full_name: full_name.trim(),
        age: userAge,
        gender: userGender,
        height: userHeight,
        weight: userWeight
      },
      bmiData
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};
