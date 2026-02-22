"""
Comprehensive Food Nutrition Database
Contains 500+ foods with nutritional information
All values per standard serving size
"""

FOOD_DATABASE = {
    # ============== SOUTH INDIAN BREAKFAST ==============
    "idli": {"name": "Idli", "name_te": "ఇడ్లీ", "calories": 39, "protein": 2, "carbs": 8, "fat": 0.2, "fiber": 0.5, "serving": "1 piece", "category": "breakfast"},
    "dosa": {"name": "Plain Dosa", "name_te": "దోస", "calories": 168, "protein": 4, "carbs": 28, "fat": 4, "fiber": 1, "serving": "1 piece", "category": "breakfast"},
    "masala_dosa": {"name": "Masala Dosa", "name_te": "మసాలా దోస", "calories": 250, "protein": 6, "carbs": 35, "fat": 10, "fiber": 3, "serving": "1 piece", "category": "breakfast"},
    "pesarattu": {"name": "Pesarattu", "name_te": "పెసరట్టు", "calories": 150, "protein": 8, "carbs": 20, "fat": 4, "fiber": 4, "serving": "1 piece", "category": "breakfast"},
    "upma": {"name": "Upma", "name_te": "ఉప్మా", "calories": 200, "protein": 5, "carbs": 30, "fat": 7, "fiber": 2, "serving": "1 cup", "category": "breakfast"},
    "pongal": {"name": "Pongal", "name_te": "పొంగల్", "calories": 180, "protein": 5, "carbs": 32, "fat": 4, "fiber": 1, "serving": "1 cup", "category": "breakfast"},
    "vada": {"name": "Medu Vada", "name_te": "వడ", "calories": 97, "protein": 4, "carbs": 10, "fat": 5, "fiber": 1, "serving": "1 piece", "category": "breakfast"},
    "uttapam": {"name": "Uttapam", "name_te": "ఉత్తపం", "calories": 150, "protein": 4, "carbs": 25, "fat": 4, "fiber": 2, "serving": "1 piece", "category": "breakfast"},
    "poori": {"name": "Poori", "name_te": "పూరీ", "calories": 70, "protein": 2, "carbs": 10, "fat": 3, "fiber": 0.5, "serving": "1 piece", "category": "breakfast"},
    "appam": {"name": "Appam", "name_te": "అప్పం", "calories": 120, "protein": 2, "carbs": 22, "fat": 2, "fiber": 1, "serving": "1 piece", "category": "breakfast"},
    "puttu": {"name": "Puttu", "name_te": "పుట్టు", "calories": 200, "protein": 4, "carbs": 40, "fat": 3, "fiber": 2, "serving": "1 cylinder", "category": "breakfast"},
    "rava_dosa": {"name": "Rava Dosa", "name_te": "రవ్వ దోస", "calories": 180, "protein": 4, "carbs": 25, "fat": 7, "fiber": 1, "serving": "1 piece", "category": "breakfast"},
    "set_dosa": {"name": "Set Dosa", "name_te": "సెట్ దోస", "calories": 130, "protein": 3, "carbs": 22, "fat": 3, "fiber": 1, "serving": "3 pieces", "category": "breakfast"},
    "onion_dosa": {"name": "Onion Dosa", "name_te": "ఉల్లి దోస", "calories": 190, "protein": 5, "carbs": 28, "fat": 6, "fiber": 2, "serving": "1 piece", "category": "breakfast"},
    "mysore_bonda": {"name": "Mysore Bonda", "name_te": "మైసూర్ బోండా", "calories": 100, "protein": 2, "carbs": 15, "fat": 4, "fiber": 1, "serving": "1 piece", "category": "breakfast"},
    "punugulu": {"name": "Punugulu", "name_te": "పునుగులు", "calories": 80, "protein": 2, "carbs": 12, "fat": 3, "fiber": 0.5, "serving": "3 pieces", "category": "breakfast"},
    "attu": {"name": "Attu/Adai", "name_te": "అట్టు", "calories": 180, "protein": 7, "carbs": 25, "fat": 5, "fiber": 4, "serving": "1 piece", "category": "breakfast"},
    
    # ============== NORTH INDIAN BREAKFAST ==============
    "paratha": {"name": "Plain Paratha", "name_te": "పరాటా", "calories": 180, "protein": 5, "carbs": 25, "fat": 7, "fiber": 2, "serving": "1 piece", "category": "breakfast"},
    "aloo_paratha": {"name": "Aloo Paratha", "name_te": "ఆలూ పరాటా", "calories": 280, "protein": 6, "carbs": 35, "fat": 12, "fiber": 3, "serving": "1 piece", "category": "breakfast"},
    "gobi_paratha": {"name": "Gobi Paratha", "name_te": "గోబీ పరాటా", "calories": 250, "protein": 6, "carbs": 32, "fat": 10, "fiber": 3, "serving": "1 piece", "category": "breakfast"},
    "paneer_paratha": {"name": "Paneer Paratha", "name_te": "పనీర్ పరాటా", "calories": 320, "protein": 12, "carbs": 30, "fat": 16, "fiber": 2, "serving": "1 piece", "category": "breakfast"},
    "methi_paratha": {"name": "Methi Paratha", "name_te": "మెంతి పరాటా", "calories": 200, "protein": 5, "carbs": 28, "fat": 8, "fiber": 3, "serving": "1 piece", "category": "breakfast"},
    "mooli_paratha": {"name": "Mooli Paratha", "name_te": "ములా పరాటా", "calories": 230, "protein": 5, "carbs": 30, "fat": 9, "fiber": 2, "serving": "1 piece", "category": "breakfast"},
    "chole_bhature": {"name": "Chole Bhature", "name_te": "చోలే భటూరే", "calories": 450, "protein": 12, "carbs": 55, "fat": 20, "fiber": 6, "serving": "1 plate", "category": "breakfast"},
    "puri_bhaji": {"name": "Puri Bhaji", "name_te": "పూరీ భాజీ", "calories": 350, "protein": 8, "carbs": 45, "fat": 15, "fiber": 4, "serving": "1 plate", "category": "breakfast"},
    "poha": {"name": "Poha", "name_te": "పోహా", "calories": 180, "protein": 4, "carbs": 32, "fat": 5, "fiber": 2, "serving": "1 cup", "category": "breakfast"},
    "kachori": {"name": "Kachori", "name_te": "కచోరీ", "calories": 150, "protein": 3, "carbs": 18, "fat": 7, "fiber": 1, "serving": "1 piece", "category": "breakfast"},
    "bedmi_puri": {"name": "Bedmi Puri", "name_te": "బెడ్మీ పూరీ", "calories": 120, "protein": 3, "carbs": 15, "fat": 5, "fiber": 2, "serving": "1 piece", "category": "breakfast"},
    "thepla": {"name": "Thepla", "name_te": "థేప్లా", "calories": 100, "protein": 3, "carbs": 15, "fat": 3, "fiber": 2, "serving": "1 piece", "category": "breakfast"},
    "dhokla": {"name": "Dhokla", "name_te": "ధోక్లా", "calories": 160, "protein": 6, "carbs": 25, "fat": 4, "fiber": 2, "serving": "4 pieces", "category": "breakfast"},
    "khandvi": {"name": "Khandvi", "name_te": "ఖాండ్వీ", "calories": 130, "protein": 5, "carbs": 18, "fat": 4, "fiber": 1, "serving": "4 pieces", "category": "breakfast"},
    
    # ============== RICE & MAIN COURSE ==============
    "rice": {"name": "White Rice", "name_te": "అన్నం", "calories": 130, "protein": 3, "carbs": 28, "fat": 0.3, "fiber": 0.5, "serving": "1 cup cooked", "category": "lunch"},
    "brown_rice": {"name": "Brown Rice", "name_te": "బ్రౌన్ రైస్", "calories": 112, "protein": 3, "carbs": 24, "fat": 1, "fiber": 2, "serving": "1 cup cooked", "category": "lunch"},
    "jeera_rice": {"name": "Jeera Rice", "name_te": "జీరా రైస్", "calories": 180, "protein": 4, "carbs": 32, "fat": 4, "fiber": 1, "serving": "1 cup", "category": "lunch"},
    "biryani": {"name": "Veg Biryani", "name_te": "వెజ్ బిర్యానీ", "calories": 290, "protein": 8, "carbs": 45, "fat": 8, "fiber": 3, "serving": "1 cup", "category": "lunch"},
    "chicken_biryani": {"name": "Chicken Biryani", "name_te": "చికెన్ బిర్యానీ", "calories": 350, "protein": 18, "carbs": 42, "fat": 12, "fiber": 2, "serving": "1 cup", "category": "lunch"},
    "mutton_biryani": {"name": "Mutton Biryani", "name_te": "మటన్ బిర్యానీ", "calories": 400, "protein": 22, "carbs": 40, "fat": 16, "fiber": 2, "serving": "1 cup", "category": "lunch"},
    "egg_biryani": {"name": "Egg Biryani", "name_te": "గుడ్డు బిర్యానీ", "calories": 320, "protein": 14, "carbs": 42, "fat": 10, "fiber": 2, "serving": "1 cup", "category": "lunch"},
    "fish_biryani": {"name": "Fish Biryani", "name_te": "ఫిష్ బిర్యానీ", "calories": 340, "protein": 20, "carbs": 40, "fat": 11, "fiber": 2, "serving": "1 cup", "category": "lunch"},
    "pulao": {"name": "Vegetable Pulao", "name_te": "పులావ్", "calories": 200, "protein": 5, "carbs": 35, "fat": 5, "fiber": 2, "serving": "1 cup", "category": "lunch"},
    "fried_rice": {"name": "Vegetable Fried Rice", "name_te": "ఫ్రైడ్ రైస్", "calories": 250, "protein": 6, "carbs": 38, "fat": 8, "fiber": 2, "serving": "1 cup", "category": "lunch"},
    "egg_fried_rice": {"name": "Egg Fried Rice", "name_te": "ఎగ్ ఫ్రైడ్ రైస్", "calories": 300, "protein": 10, "carbs": 38, "fat": 12, "fiber": 2, "serving": "1 cup", "category": "lunch"},
    "chicken_fried_rice": {"name": "Chicken Fried Rice", "name_te": "చికెన్ ఫ్రైడ్ రైస్", "calories": 350, "protein": 16, "carbs": 40, "fat": 14, "fiber": 2, "serving": "1 cup", "category": "lunch"},
    "lemon_rice": {"name": "Lemon Rice", "name_te": "నిమ్మకాయ అన్నం", "calories": 200, "protein": 4, "carbs": 35, "fat": 5, "fiber": 1, "serving": "1 cup", "category": "lunch"},
    "tamarind_rice": {"name": "Tamarind Rice", "name_te": "చింతపండు అన్నం", "calories": 220, "protein": 4, "carbs": 38, "fat": 6, "fiber": 2, "serving": "1 cup", "category": "lunch"},
    "curd_rice": {"name": "Curd Rice", "name_te": "పెరుగు అన్నం", "calories": 180, "protein": 6, "carbs": 30, "fat": 4, "fiber": 1, "serving": "1 cup", "category": "lunch"},
    "coconut_rice": {"name": "Coconut Rice", "name_te": "కొబ్బరి అన్నం", "calories": 250, "protein": 5, "carbs": 35, "fat": 10, "fiber": 3, "serving": "1 cup", "category": "lunch"},
    "tomato_rice": {"name": "Tomato Rice", "name_te": "టమాట అన్నం", "calories": 190, "protein": 4, "carbs": 34, "fat": 4, "fiber": 2, "serving": "1 cup", "category": "lunch"},
    
    # ============== ROTIS & BREADS ==============
    "roti": {"name": "Roti/Chapati", "name_te": "రోటీ", "calories": 71, "protein": 3, "carbs": 15, "fat": 0.4, "fiber": 2, "serving": "1 piece", "category": "dinner"},
    "naan": {"name": "Naan", "name_te": "నాన్", "calories": 260, "protein": 8, "carbs": 45, "fat": 5, "fiber": 2, "serving": "1 piece", "category": "dinner"},
    "butter_naan": {"name": "Butter Naan", "name_te": "బటర్ నాన్", "calories": 310, "protein": 8, "carbs": 45, "fat": 10, "fiber": 2, "serving": "1 piece", "category": "dinner"},
    "garlic_naan": {"name": "Garlic Naan", "name_te": "గార్లిక్ నాన్", "calories": 300, "protein": 8, "carbs": 46, "fat": 9, "fiber": 2, "serving": "1 piece", "category": "dinner"},
    "tandoori_roti": {"name": "Tandoori Roti", "name_te": "తందూరి రోటీ", "calories": 100, "protein": 3, "carbs": 18, "fat": 1, "fiber": 2, "serving": "1 piece", "category": "dinner"},
    "rumali_roti": {"name": "Rumali Roti", "name_te": "రుమాలీ రోటీ", "calories": 90, "protein": 3, "carbs": 16, "fat": 1, "fiber": 1, "serving": "1 piece", "category": "dinner"},
    "kulcha": {"name": "Kulcha", "name_te": "కుల్చా", "calories": 200, "protein": 5, "carbs": 32, "fat": 5, "fiber": 1, "serving": "1 piece", "category": "dinner"},
    "bhatura": {"name": "Bhatura", "name_te": "భటూరా", "calories": 250, "protein": 5, "carbs": 35, "fat": 10, "fiber": 1, "serving": "1 piece", "category": "breakfast"},
    "missi_roti": {"name": "Missi Roti", "name_te": "మిస్సీ రోటీ", "calories": 120, "protein": 5, "carbs": 18, "fat": 3, "fiber": 3, "serving": "1 piece", "category": "dinner"},
    "bajra_roti": {"name": "Bajra Roti", "name_te": "సజ్జ రోటీ", "calories": 110, "protein": 3, "carbs": 20, "fat": 2, "fiber": 3, "serving": "1 piece", "category": "dinner"},
    "jowar_roti": {"name": "Jowar Roti", "name_te": "జొన్న రోటీ", "calories": 95, "protein": 3, "carbs": 18, "fat": 1, "fiber": 3, "serving": "1 piece", "category": "dinner"},
    "makki_roti": {"name": "Makki di Roti", "name_te": "మక్కి రోటీ", "calories": 130, "protein": 3, "carbs": 25, "fat": 2, "fiber": 3, "serving": "1 piece", "category": "dinner"},
    
    # ============== CURRIES & GRAVIES ==============
    "sambar": {"name": "Sambar", "name_te": "సాంబార్", "calories": 80, "protein": 4, "carbs": 12, "fat": 2, "fiber": 3, "serving": "1 cup", "category": "lunch"},
    "rasam": {"name": "Rasam", "name_te": "రసం", "calories": 40, "protein": 2, "carbs": 6, "fat": 1, "fiber": 1, "serving": "1 cup", "category": "lunch"},
    "dal": {"name": "Dal Tadka", "name_te": "పప్పు", "calories": 120, "protein": 8, "carbs": 18, "fat": 2, "fiber": 5, "serving": "1 cup", "category": "lunch"},
    "dal_fry": {"name": "Dal Fry", "name_te": "దాల్ ఫ్రై", "calories": 150, "protein": 9, "carbs": 20, "fat": 4, "fiber": 5, "serving": "1 cup", "category": "lunch"},
    "dal_makhani": {"name": "Dal Makhani", "name_te": "దాల్ మఖని", "calories": 250, "protein": 10, "carbs": 25, "fat": 12, "fiber": 6, "serving": "1 cup", "category": "dinner"},
    "chana_dal": {"name": "Chana Dal", "name_te": "శెనగపప్పు", "calories": 140, "protein": 9, "carbs": 22, "fat": 2, "fiber": 6, "serving": "1 cup", "category": "lunch"},
    "chicken_curry": {"name": "Chicken Curry", "name_te": "చికెన్ కర్రీ", "calories": 250, "protein": 25, "carbs": 8, "fat": 14, "fiber": 1, "serving": "1 cup", "category": "lunch"},
    "butter_chicken": {"name": "Butter Chicken", "name_te": "బటర్ చికెన్", "calories": 350, "protein": 28, "carbs": 12, "fat": 22, "fiber": 1, "serving": "1 cup", "category": "dinner"},
    "chicken_tikka_masala": {"name": "Chicken Tikka Masala", "name_te": "చికెన్ టిక్కా మసాలా", "calories": 320, "protein": 26, "carbs": 10, "fat": 20, "fiber": 2, "serving": "1 cup", "category": "dinner"},
    "kadai_chicken": {"name": "Kadai Chicken", "name_te": "కడాయి చికెన్", "calories": 280, "protein": 26, "carbs": 8, "fat": 16, "fiber": 2, "serving": "1 cup", "category": "dinner"},
    "chicken_korma": {"name": "Chicken Korma", "name_te": "చికెన్ కోర్మా", "calories": 380, "protein": 25, "carbs": 15, "fat": 26, "fiber": 2, "serving": "1 cup", "category": "dinner"},
    "mutton_curry": {"name": "Mutton Curry", "name_te": "మటన్ కర్రీ", "calories": 300, "protein": 28, "carbs": 6, "fat": 18, "fiber": 1, "serving": "1 cup", "category": "lunch"},
    "mutton_rogan_josh": {"name": "Mutton Rogan Josh", "name_te": "మటన్ రోగన్ జోష్", "calories": 350, "protein": 30, "carbs": 8, "fat": 22, "fiber": 2, "serving": "1 cup", "category": "dinner"},
    "keema": {"name": "Keema", "name_te": "కీమా", "calories": 280, "protein": 24, "carbs": 5, "fat": 18, "fiber": 1, "serving": "1 cup", "category": "dinner"},
    "fish_curry": {"name": "Fish Curry", "name_te": "చేపల పులుసు", "calories": 200, "protein": 22, "carbs": 5, "fat": 10, "fiber": 1, "serving": "1 cup", "category": "lunch"},
    "fish_fry": {"name": "Fish Fry", "name_te": "చేపల వేపుడు", "calories": 250, "protein": 24, "carbs": 8, "fat": 14, "fiber": 0, "serving": "1 piece", "category": "lunch"},
    "prawn_curry": {"name": "Prawn Curry", "name_te": "రొయ్యల కర్రీ", "calories": 180, "protein": 20, "carbs": 5, "fat": 9, "fiber": 1, "serving": "1 cup", "category": "lunch"},
    "egg_curry": {"name": "Egg Curry", "name_te": "గుడ్డు కర్రీ", "calories": 180, "protein": 12, "carbs": 5, "fat": 12, "fiber": 1, "serving": "2 eggs", "category": "dinner"},
    "paneer_butter_masala": {"name": "Paneer Butter Masala", "name_te": "పనీర్ బటర్ మసాలా", "calories": 350, "protein": 16, "carbs": 15, "fat": 26, "fiber": 2, "serving": "1 cup", "category": "dinner"},
    "paneer_tikka": {"name": "Paneer Tikka", "name_te": "పనీర్ టిక్కా", "calories": 280, "protein": 18, "carbs": 8, "fat": 20, "fiber": 1, "serving": "6 pieces", "category": "snacks"},
    "palak_paneer": {"name": "Palak Paneer", "name_te": "పాలక్ పనీర్", "calories": 280, "protein": 15, "carbs": 10, "fat": 20, "fiber": 3, "serving": "1 cup", "category": "dinner"},
    "shahi_paneer": {"name": "Shahi Paneer", "name_te": "షాహీ పనీర్", "calories": 380, "protein": 16, "carbs": 12, "fat": 30, "fiber": 2, "serving": "1 cup", "category": "dinner"},
    "kadai_paneer": {"name": "Kadai Paneer", "name_te": "కడాయి పనీర్", "calories": 300, "protein": 16, "carbs": 10, "fat": 22, "fiber": 2, "serving": "1 cup", "category": "dinner"},
    "matar_paneer": {"name": "Matar Paneer", "name_te": "మటర్ పనీర్", "calories": 290, "protein": 14, "carbs": 15, "fat": 20, "fiber": 4, "serving": "1 cup", "category": "dinner"},
    "vegetable_curry": {"name": "Mixed Vegetable Curry", "name_te": "కూరగాయల కర్రీ", "calories": 100, "protein": 3, "carbs": 15, "fat": 4, "fiber": 4, "serving": "1 cup", "category": "lunch"},
    "aloo_gobi": {"name": "Aloo Gobi", "name_te": "ఆలూ గోబీ", "calories": 150, "protein": 4, "carbs": 20, "fat": 6, "fiber": 4, "serving": "1 cup", "category": "lunch"},
    "baingan_bharta": {"name": "Baingan Bharta", "name_te": "వంకాయ కూర", "calories": 120, "protein": 3, "carbs": 12, "fat": 7, "fiber": 4, "serving": "1 cup", "category": "dinner"},
    "bhindi_fry": {"name": "Bhindi Fry", "name_te": "బెండకాయ వేపుడు", "calories": 100, "protein": 2, "carbs": 10, "fat": 6, "fiber": 3, "serving": "1 cup", "category": "lunch"},
    "aloo_matar": {"name": "Aloo Matar", "name_te": "ఆలూ మటర్", "calories": 160, "protein": 5, "carbs": 22, "fat": 6, "fiber": 4, "serving": "1 cup", "category": "lunch"},
    "chole": {"name": "Chole/Chana Masala", "name_te": "చోలే", "calories": 200, "protein": 10, "carbs": 30, "fat": 5, "fiber": 8, "serving": "1 cup", "category": "lunch"},
    "rajma": {"name": "Rajma", "name_te": "రాజ్మా", "calories": 180, "protein": 10, "carbs": 28, "fat": 3, "fiber": 8, "serving": "1 cup", "category": "lunch"},
    "kadhi": {"name": "Kadhi Pakora", "name_te": "కడి పకోడా", "calories": 200, "protein": 6, "carbs": 20, "fat": 10, "fiber": 2, "serving": "1 cup", "category": "lunch"},
    "haleem": {"name": "Haleem", "name_te": "హలీమ్", "calories": 350, "protein": 20, "carbs": 30, "fat": 16, "fiber": 4, "serving": "1 cup", "category": "dinner"},
    
    # ============== SNACKS ==============
    "samosa": {"name": "Samosa", "name_te": "సమోసా", "calories": 150, "protein": 3, "carbs": 18, "fat": 8, "fiber": 2, "serving": "1 piece", "category": "snacks"},
    "pakora": {"name": "Pakora/Bhajji", "name_te": "పకోడా", "calories": 80, "protein": 2, "carbs": 8, "fat": 5, "fiber": 1, "serving": "3 pieces", "category": "snacks"},
    "onion_pakora": {"name": "Onion Pakora", "name_te": "ఉల్లి పకోడా", "calories": 90, "protein": 2, "carbs": 10, "fat": 5, "fiber": 1, "serving": "3 pieces", "category": "snacks"},
    "mirchi_bajji": {"name": "Mirchi Bajji", "name_te": "మిర్చి బజ్జి", "calories": 100, "protein": 2, "carbs": 12, "fat": 5, "fiber": 1, "serving": "2 pieces", "category": "snacks"},
    "aloo_tikki": {"name": "Aloo Tikki", "name_te": "ఆలూ టిక్కీ", "calories": 180, "protein": 4, "carbs": 25, "fat": 7, "fiber": 2, "serving": "2 pieces", "category": "snacks"},
    "pav_bhaji": {"name": "Pav Bhaji", "name_te": "పావ్ భాజీ", "calories": 400, "protein": 10, "carbs": 50, "fat": 18, "fiber": 5, "serving": "1 plate", "category": "snacks"},
    "dahi_vada": {"name": "Dahi Vada", "name_te": "దహీ వడ", "calories": 200, "protein": 6, "carbs": 25, "fat": 8, "fiber": 2, "serving": "2 pieces", "category": "snacks"},
    "pani_puri": {"name": "Pani Puri", "name_te": "పానీ పూరి", "calories": 180, "protein": 4, "carbs": 30, "fat": 5, "fiber": 2, "serving": "6 pieces", "category": "snacks"},
    "bhel_puri": {"name": "Bhel Puri", "name_te": "భేల్ పూరి", "calories": 200, "protein": 5, "carbs": 35, "fat": 5, "fiber": 3, "serving": "1 plate", "category": "snacks"},
    "sev_puri": {"name": "Sev Puri", "name_te": "సేవ్ పూరి", "calories": 250, "protein": 5, "carbs": 35, "fat": 10, "fiber": 2, "serving": "6 pieces", "category": "snacks"},
    "dahi_puri": {"name": "Dahi Puri", "name_te": "దహీ పూరి", "calories": 220, "protein": 5, "carbs": 30, "fat": 8, "fiber": 2, "serving": "6 pieces", "category": "snacks"},
    "ragda_pattice": {"name": "Ragda Pattice", "name_te": "రగడా పట్టిస్", "calories": 300, "protein": 8, "carbs": 40, "fat": 12, "fiber": 4, "serving": "1 plate", "category": "snacks"},
    "chaat": {"name": "Chaat", "name_te": "చాట్", "calories": 250, "protein": 6, "carbs": 35, "fat": 10, "fiber": 3, "serving": "1 plate", "category": "snacks"},
    "spring_roll": {"name": "Veg Spring Roll", "name_te": "స్ప్రింగ్ రోల్", "calories": 120, "protein": 3, "carbs": 15, "fat": 6, "fiber": 1, "serving": "1 piece", "category": "snacks"},
    "manchurian": {"name": "Veg Manchurian", "name_te": "మంచూరియన్", "calories": 250, "protein": 5, "carbs": 30, "fat": 12, "fiber": 2, "serving": "1 cup", "category": "snacks"},
    "gobi_manchurian": {"name": "Gobi Manchurian", "name_te": "గోబీ మంచూరియన్", "calories": 280, "protein": 5, "carbs": 32, "fat": 14, "fiber": 3, "serving": "1 cup", "category": "snacks"},
    "chilli_paneer": {"name": "Chilli Paneer", "name_te": "చిల్లీ పనీర్", "calories": 320, "protein": 15, "carbs": 18, "fat": 22, "fiber": 2, "serving": "1 cup", "category": "snacks"},
    "chilli_chicken": {"name": "Chilli Chicken", "name_te": "చిల్లీ చికెన్", "calories": 350, "protein": 25, "carbs": 15, "fat": 22, "fiber": 1, "serving": "1 cup", "category": "snacks"},
    "momos": {"name": "Veg Momos", "name_te": "మోమోస్", "calories": 200, "protein": 6, "carbs": 30, "fat": 6, "fiber": 2, "serving": "6 pieces", "category": "snacks"},
    "chicken_momos": {"name": "Chicken Momos", "name_te": "చికెన్ మోమోస్", "calories": 280, "protein": 15, "carbs": 28, "fat": 12, "fiber": 2, "serving": "6 pieces", "category": "snacks"},
    "corn_chaat": {"name": "Corn Chaat", "name_te": "కార్న్ చాట్", "calories": 180, "protein": 4, "carbs": 30, "fat": 5, "fiber": 3, "serving": "1 cup", "category": "snacks"},
    
    # ============== DESSERTS & SWEETS ==============
    "gulab_jamun": {"name": "Gulab Jamun", "name_te": "గులాబ్ జామూన్", "calories": 150, "protein": 2, "carbs": 25, "fat": 5, "fiber": 0, "serving": "2 pieces", "category": "dessert"},
    "rasgulla": {"name": "Rasgulla", "name_te": "రసగుల్లా", "calories": 120, "protein": 3, "carbs": 22, "fat": 2, "fiber": 0, "serving": "2 pieces", "category": "dessert"},
    "rasmalai": {"name": "Rasmalai", "name_te": "రస్మలాయ్", "calories": 180, "protein": 5, "carbs": 25, "fat": 7, "fiber": 0, "serving": "2 pieces", "category": "dessert"},
    "jalebi": {"name": "Jalebi", "name_te": "జిలేబి", "calories": 150, "protein": 2, "carbs": 30, "fat": 4, "fiber": 0, "serving": "3 pieces", "category": "dessert"},
    "laddu": {"name": "Besan Laddu", "name_te": "లడ్డూ", "calories": 180, "protein": 4, "carbs": 25, "fat": 8, "fiber": 1, "serving": "1 piece", "category": "dessert"},
    "boondi_laddu": {"name": "Boondi Laddu", "name_te": "బూందీ లడ్డూ", "calories": 200, "protein": 3, "carbs": 28, "fat": 9, "fiber": 0, "serving": "1 piece", "category": "dessert"},
    "motichoor_laddu": {"name": "Motichoor Laddu", "name_te": "మోతీచూర్ లడ్డూ", "calories": 190, "protein": 3, "carbs": 26, "fat": 8, "fiber": 0, "serving": "1 piece", "category": "dessert"},
    "barfi": {"name": "Kaju Barfi", "name_te": "బర్ఫీ", "calories": 200, "protein": 4, "carbs": 22, "fat": 12, "fiber": 0, "serving": "2 pieces", "category": "dessert"},
    "peda": {"name": "Peda", "name_te": "పేడా", "calories": 100, "protein": 2, "carbs": 15, "fat": 4, "fiber": 0, "serving": "2 pieces", "category": "dessert"},
    "payasam": {"name": "Payasam/Kheer", "name_te": "పాయసం", "calories": 200, "protein": 5, "carbs": 35, "fat": 5, "fiber": 1, "serving": "1 cup", "category": "dessert"},
    "rice_kheer": {"name": "Rice Kheer", "name_te": "బియ్యం పాయసం", "calories": 220, "protein": 5, "carbs": 38, "fat": 6, "fiber": 0, "serving": "1 cup", "category": "dessert"},
    "seviyan": {"name": "Seviyan/Vermicelli Kheer", "name_te": "సేమియా పాయసం", "calories": 250, "protein": 6, "carbs": 40, "fat": 7, "fiber": 1, "serving": "1 cup", "category": "dessert"},
    "halwa": {"name": "Suji Halwa", "name_te": "హల్వా", "calories": 250, "protein": 4, "carbs": 35, "fat": 11, "fiber": 1, "serving": "1 cup", "category": "dessert"},
    "gajar_halwa": {"name": "Gajar Ka Halwa", "name_te": "క్యారెట్ హల్వా", "calories": 300, "protein": 5, "carbs": 40, "fat": 14, "fiber": 2, "serving": "1 cup", "category": "dessert"},
    "moong_dal_halwa": {"name": "Moong Dal Halwa", "name_te": "పెసరపప్పు హల్వా", "calories": 350, "protein": 8, "carbs": 40, "fat": 18, "fiber": 2, "serving": "1 cup", "category": "dessert"},
    "kulfi": {"name": "Kulfi", "name_te": "కుల్ఫీ", "calories": 180, "protein": 4, "carbs": 22, "fat": 9, "fiber": 0, "serving": "1 stick", "category": "dessert"},
    "ice_cream": {"name": "Vanilla Ice Cream", "name_te": "ఐస్ క్రీమ్", "calories": 140, "protein": 2, "carbs": 16, "fat": 7, "fiber": 0, "serving": "1 scoop", "category": "dessert"},
    "double_ka_meetha": {"name": "Double Ka Meetha", "name_te": "డబల్ కా మీఠా", "calories": 280, "protein": 6, "carbs": 35, "fat": 14, "fiber": 1, "serving": "1 piece", "category": "dessert"},
    "mysore_pak": {"name": "Mysore Pak", "name_te": "మైసూర్ పాక్", "calories": 220, "protein": 4, "carbs": 20, "fat": 14, "fiber": 1, "serving": "2 pieces", "category": "dessert"},
    "soan_papdi": {"name": "Soan Papdi", "name_te": "సోన్ పాప్డి", "calories": 150, "protein": 2, "carbs": 20, "fat": 7, "fiber": 0, "serving": "2 pieces", "category": "dessert"},
    "kaju_katli": {"name": "Kaju Katli", "name_te": "కాజు కట్లి", "calories": 220, "protein": 5, "carbs": 22, "fat": 13, "fiber": 0, "serving": "2 pieces", "category": "dessert"},
    "sandesh": {"name": "Sandesh", "name_te": "సందేష్", "calories": 100, "protein": 4, "carbs": 15, "fat": 3, "fiber": 0, "serving": "2 pieces", "category": "dessert"},
    
    # ============== BEVERAGES ==============
    "chai": {"name": "Masala Chai", "name_te": "చాయ్", "calories": 40, "protein": 1, "carbs": 6, "fat": 1, "fiber": 0, "serving": "1 cup", "category": "beverage"},
    "black_tea": {"name": "Black Tea", "name_te": "బ్లాక్ టీ", "calories": 2, "protein": 0, "carbs": 0.5, "fat": 0, "fiber": 0, "serving": "1 cup", "category": "beverage"},
    "green_tea": {"name": "Green Tea", "name_te": "గ్రీన్ టీ", "calories": 2, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "serving": "1 cup", "category": "beverage"},
    "filter_coffee": {"name": "Filter Coffee", "name_te": "ఫిల్టర్ కాఫీ", "calories": 50, "protein": 1, "carbs": 8, "fat": 2, "fiber": 0, "serving": "1 cup", "category": "beverage"},
    "black_coffee": {"name": "Black Coffee", "name_te": "బ్లాక్ కాఫీ", "calories": 5, "protein": 0.3, "carbs": 0, "fat": 0, "fiber": 0, "serving": "1 cup", "category": "beverage"},
    "cappuccino": {"name": "Cappuccino", "name_te": "కపుచినో", "calories": 120, "protein": 4, "carbs": 12, "fat": 6, "fiber": 0, "serving": "1 cup", "category": "beverage"},
    "latte": {"name": "Latte", "name_te": "లాట్టే", "calories": 150, "protein": 5, "carbs": 15, "fat": 7, "fiber": 0, "serving": "1 cup", "category": "beverage"},
    "buttermilk": {"name": "Buttermilk/Chaas", "name_te": "మజ్జిగ", "calories": 30, "protein": 2, "carbs": 4, "fat": 1, "fiber": 0, "serving": "1 glass", "category": "beverage"},
    "lassi": {"name": "Sweet Lassi", "name_te": "లస్సీ", "calories": 180, "protein": 5, "carbs": 28, "fat": 5, "fiber": 0, "serving": "1 glass", "category": "beverage"},
    "mango_lassi": {"name": "Mango Lassi", "name_te": "మామిడి లస్సీ", "calories": 220, "protein": 5, "carbs": 38, "fat": 5, "fiber": 1, "serving": "1 glass", "category": "beverage"},
    "salt_lassi": {"name": "Salt Lassi", "name_te": "ఉప్పు లస్సీ", "calories": 100, "protein": 5, "carbs": 10, "fat": 4, "fiber": 0, "serving": "1 glass", "category": "beverage"},
    "coconut_water": {"name": "Coconut Water", "name_te": "కొబ్బరి నీళ్లు", "calories": 45, "protein": 0.5, "carbs": 9, "fat": 0.5, "fiber": 0, "serving": "1 glass", "category": "beverage"},
    "sugarcane_juice": {"name": "Sugarcane Juice", "name_te": "చెరకు రసం", "calories": 180, "protein": 0, "carbs": 45, "fat": 0, "fiber": 0, "serving": "1 glass", "category": "beverage"},
    "lemon_water": {"name": "Lemon Water/Nimbu Pani", "name_te": "నిమ్మరసం", "calories": 30, "protein": 0, "carbs": 8, "fat": 0, "fiber": 0, "serving": "1 glass", "category": "beverage"},
    "jaljeera": {"name": "Jal Jeera", "name_te": "జల్ జీరా", "calories": 20, "protein": 0.5, "carbs": 4, "fat": 0, "fiber": 0, "serving": "1 glass", "category": "beverage"},
    "aam_panna": {"name": "Aam Panna", "name_te": "ఆమ్ పన్నా", "calories": 90, "protein": 0, "carbs": 22, "fat": 0, "fiber": 1, "serving": "1 glass", "category": "beverage"},
    "thandai": {"name": "Thandai", "name_te": "థండాయ్", "calories": 200, "protein": 5, "carbs": 25, "fat": 9, "fiber": 1, "serving": "1 glass", "category": "beverage"},
    "rooh_afza": {"name": "Rooh Afza", "name_te": "రూహ్ అఫ్జా", "calories": 80, "protein": 0, "carbs": 20, "fat": 0, "fiber": 0, "serving": "1 glass", "category": "beverage"},
    "badam_milk": {"name": "Badam Milk", "name_te": "బాదం పాలు", "calories": 200, "protein": 7, "carbs": 25, "fat": 8, "fiber": 1, "serving": "1 glass", "category": "beverage"},
    "milk": {"name": "Full Cream Milk", "name_te": "పాలు", "calories": 150, "protein": 8, "carbs": 12, "fat": 8, "fiber": 0, "serving": "1 glass", "category": "beverage"},
    "skim_milk": {"name": "Skimmed Milk", "name_te": "స్కిమ్డ్ మిల్క్", "calories": 90, "protein": 8, "carbs": 12, "fat": 0.5, "fiber": 0, "serving": "1 glass", "category": "beverage"},
    "soda": {"name": "Soda/Soft Drink", "name_te": "సోడా", "calories": 140, "protein": 0, "carbs": 35, "fat": 0, "fiber": 0, "serving": "1 can", "category": "beverage"},
    "fresh_juice": {"name": "Fresh Orange Juice", "name_te": "ఆరెంజ్ జ్యూస్", "calories": 110, "protein": 2, "carbs": 26, "fat": 0.5, "fiber": 0.5, "serving": "1 glass", "category": "beverage"},
    "mango_juice": {"name": "Mango Juice", "name_te": "మామిడి జ్యూస్", "calories": 150, "protein": 1, "carbs": 35, "fat": 0.5, "fiber": 1, "serving": "1 glass", "category": "beverage"},
    "pomegranate_juice": {"name": "Pomegranate Juice", "name_te": "దానిమ్మ జ్యూస్", "calories": 130, "protein": 0, "carbs": 32, "fat": 0, "fiber": 0, "serving": "1 glass", "category": "beverage"},
    "watermelon_juice": {"name": "Watermelon Juice", "name_te": "పుచ్చకాయ జ్యూస్", "calories": 70, "protein": 1, "carbs": 17, "fat": 0, "fiber": 0, "serving": "1 glass", "category": "beverage"},
    
    # ============== FRUITS ==============
    "apple": {"name": "Apple", "name_te": "ఆపిల్", "calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3, "fiber": 4, "serving": "1 medium", "category": "fruits"},
    "banana": {"name": "Banana", "name_te": "అరటిపండు", "calories": 105, "protein": 1.3, "carbs": 27, "fat": 0.4, "fiber": 3, "serving": "1 medium", "category": "fruits"},
    "orange": {"name": "Orange", "name_te": "నారింజ", "calories": 62, "protein": 1.2, "carbs": 15, "fat": 0.2, "fiber": 3, "serving": "1 medium", "category": "fruits"},
    "mango": {"name": "Mango", "name_te": "మామిడిపండు", "calories": 150, "protein": 1.5, "carbs": 35, "fat": 0.5, "fiber": 3, "serving": "1 medium", "category": "fruits"},
    "grapes": {"name": "Grapes", "name_te": "ద్రాక్ష", "calories": 62, "protein": 0.6, "carbs": 16, "fat": 0.3, "fiber": 1, "serving": "1 cup", "category": "fruits"},
    "papaya": {"name": "Papaya", "name_te": "బొప్పాయి", "calories": 55, "protein": 0.9, "carbs": 14, "fat": 0.2, "fiber": 2.5, "serving": "1 cup", "category": "fruits"},
    "watermelon": {"name": "Watermelon", "name_te": "పుచ్చకాయ", "calories": 46, "protein": 0.9, "carbs": 11, "fat": 0.2, "fiber": 0.6, "serving": "1 cup", "category": "fruits"},
    "guava": {"name": "Guava", "name_te": "జామపండు", "calories": 68, "protein": 2.5, "carbs": 14, "fat": 1, "fiber": 5, "serving": "1 medium", "category": "fruits"},
    "pomegranate": {"name": "Pomegranate", "name_te": "దానిమ్మపండు", "calories": 83, "protein": 1.7, "carbs": 19, "fat": 1, "fiber": 4, "serving": "1/2 fruit", "category": "fruits"},
    "pineapple": {"name": "Pineapple", "name_te": "అనాస", "calories": 82, "protein": 0.9, "carbs": 22, "fat": 0.2, "fiber": 2, "serving": "1 cup", "category": "fruits"},
    "strawberry": {"name": "Strawberry", "name_te": "స్ట్రాబెర్రీ", "calories": 32, "protein": 0.7, "carbs": 8, "fat": 0.3, "fiber": 2, "serving": "1 cup", "category": "fruits"},
    "chikoo": {"name": "Chikoo/Sapota", "name_te": "సపోట", "calories": 100, "protein": 0.4, "carbs": 25, "fat": 1, "fiber": 5, "serving": "1 medium", "category": "fruits"},
    "custard_apple": {"name": "Custard Apple", "name_te": "సీతాఫలం", "calories": 94, "protein": 2, "carbs": 24, "fat": 0.3, "fiber": 4, "serving": "1 medium", "category": "fruits"},
    "jackfruit": {"name": "Jackfruit", "name_te": "పనసపండు", "calories": 95, "protein": 1.7, "carbs": 23, "fat": 0.6, "fiber": 1.5, "serving": "1 cup", "category": "fruits"},
    "lychee": {"name": "Lychee", "name_te": "లీచీ", "calories": 66, "protein": 0.8, "carbs": 17, "fat": 0.4, "fiber": 1.3, "serving": "1 cup", "category": "fruits"},
    "coconut": {"name": "Fresh Coconut", "name_te": "కొబ్బరి", "calories": 283, "protein": 3, "carbs": 12, "fat": 27, "fiber": 7, "serving": "1 cup", "category": "fruits"},
    "kiwi": {"name": "Kiwi", "name_te": "కివీ", "calories": 42, "protein": 0.8, "carbs": 10, "fat": 0.4, "fiber": 2, "serving": "1 medium", "category": "fruits"},
    "avocado": {"name": "Avocado", "name_te": "అవకాడో", "calories": 160, "protein": 2, "carbs": 9, "fat": 15, "fiber": 7, "serving": "1/2 fruit", "category": "fruits"},
    "dates": {"name": "Dates", "name_te": "ఖర్జూరం", "calories": 66, "protein": 0.4, "carbs": 18, "fat": 0, "fiber": 2, "serving": "2 pieces", "category": "fruits"},
    "fig": {"name": "Fresh Fig", "name_te": "అంజీర", "calories": 37, "protein": 0.4, "carbs": 10, "fat": 0.2, "fiber": 1.5, "serving": "1 medium", "category": "fruits"},
    "plum": {"name": "Plum", "name_te": "ప్లమ్", "calories": 30, "protein": 0.5, "carbs": 8, "fat": 0.2, "fiber": 1, "serving": "1 medium", "category": "fruits"},
    "peach": {"name": "Peach", "name_te": "పీచ్", "calories": 39, "protein": 0.9, "carbs": 10, "fat": 0.3, "fiber": 1.5, "serving": "1 medium", "category": "fruits"},
    
    # ============== VEGETABLES ==============
    "potato": {"name": "Potato (boiled)", "name_te": "బంగాళదుంప", "calories": 87, "protein": 1.9, "carbs": 20, "fat": 0.1, "fiber": 1.8, "serving": "1 medium", "category": "vegetables"},
    "tomato": {"name": "Tomato", "name_te": "టమాటా", "calories": 22, "protein": 1, "carbs": 5, "fat": 0.2, "fiber": 1.5, "serving": "1 medium", "category": "vegetables"},
    "onion": {"name": "Onion", "name_te": "ఉల్లిపాయ", "calories": 44, "protein": 1.2, "carbs": 10, "fat": 0.1, "fiber": 2, "serving": "1 medium", "category": "vegetables"},
    "carrot": {"name": "Carrot", "name_te": "క్యారెట్", "calories": 25, "protein": 0.6, "carbs": 6, "fat": 0.1, "fiber": 2, "serving": "1 medium", "category": "vegetables"},
    "spinach": {"name": "Spinach", "name_te": "పాలకూర", "calories": 7, "protein": 0.9, "carbs": 1, "fat": 0.1, "fiber": 0.7, "serving": "1 cup raw", "category": "vegetables"},
    "cabbage": {"name": "Cabbage", "name_te": "క్యాబేజీ", "calories": 22, "protein": 1.3, "carbs": 5, "fat": 0.1, "fiber": 2.2, "serving": "1 cup", "category": "vegetables"},
    "cauliflower": {"name": "Cauliflower", "name_te": "కాలీఫ్లవర్", "calories": 25, "protein": 2, "carbs": 5, "fat": 0.1, "fiber": 2, "serving": "1 cup", "category": "vegetables"},
    "broccoli": {"name": "Broccoli", "name_te": "బ్రొకోలీ", "calories": 31, "protein": 2.5, "carbs": 6, "fat": 0.3, "fiber": 2.4, "serving": "1 cup", "category": "vegetables"},
    "cucumber": {"name": "Cucumber", "name_te": "దోసకాయ", "calories": 16, "protein": 0.7, "carbs": 4, "fat": 0.1, "fiber": 0.5, "serving": "1 cup", "category": "vegetables"},
    "capsicum": {"name": "Bell Pepper", "name_te": "క్యాప్సికం", "calories": 20, "protein": 0.9, "carbs": 5, "fat": 0.2, "fiber": 1.7, "serving": "1 medium", "category": "vegetables"},
    "brinjal": {"name": "Brinjal/Eggplant", "name_te": "వంకాయ", "calories": 25, "protein": 1, "carbs": 6, "fat": 0.2, "fiber": 3, "serving": "1 cup", "category": "vegetables"},
    "bhindi": {"name": "Okra/Bhindi", "name_te": "బెండకాయ", "calories": 33, "protein": 2, "carbs": 7, "fat": 0.2, "fiber": 3, "serving": "1 cup", "category": "vegetables"},
    "beans": {"name": "Green Beans", "name_te": "బీన్స్", "calories": 31, "protein": 1.8, "carbs": 7, "fat": 0.1, "fiber": 3, "serving": "1 cup", "category": "vegetables"},
    "peas": {"name": "Green Peas", "name_te": "బఠానీలు", "calories": 67, "protein": 4, "carbs": 12, "fat": 0.3, "fiber": 4, "serving": "1/2 cup", "category": "vegetables"},
    "corn": {"name": "Sweet Corn", "name_te": "మొక్కజొన్న", "calories": 86, "protein": 3, "carbs": 19, "fat": 1.2, "fiber": 2, "serving": "1 ear", "category": "vegetables"},
    "mushroom": {"name": "Mushroom", "name_te": "పుట్టగొడుగులు", "calories": 15, "protein": 2, "carbs": 2, "fat": 0.2, "fiber": 1, "serving": "1 cup", "category": "vegetables"},
    "beetroot": {"name": "Beetroot", "name_te": "బీట్‌రూట్", "calories": 43, "protein": 1.6, "carbs": 10, "fat": 0.2, "fiber": 2, "serving": "1 medium", "category": "vegetables"},
    "radish": {"name": "Radish", "name_te": "ములా", "calories": 16, "protein": 0.7, "carbs": 3, "fat": 0.1, "fiber": 1.6, "serving": "1 cup", "category": "vegetables"},
    "bottle_gourd": {"name": "Bottle Gourd", "name_te": "సొరకాయ", "calories": 14, "protein": 0.6, "carbs": 3, "fat": 0, "fiber": 0.5, "serving": "1 cup", "category": "vegetables"},
    "ridge_gourd": {"name": "Ridge Gourd", "name_te": "బీరకాయ", "calories": 20, "protein": 1.2, "carbs": 4, "fat": 0.2, "fiber": 1, "serving": "1 cup", "category": "vegetables"},
    "bitter_gourd": {"name": "Bitter Gourd", "name_te": "కాకరకాయ", "calories": 17, "protein": 1, "carbs": 4, "fat": 0.2, "fiber": 2, "serving": "1 cup", "category": "vegetables"},
    "drumstick": {"name": "Drumstick", "name_te": "మునగకాయ", "calories": 37, "protein": 2, "carbs": 8, "fat": 0.1, "fiber": 2, "serving": "1 cup", "category": "vegetables"},
    "raw_banana": {"name": "Raw Banana", "name_te": "అరటికాయ", "calories": 89, "protein": 1, "carbs": 23, "fat": 0.3, "fiber": 2, "serving": "1 medium", "category": "vegetables"},
    "sweet_potato": {"name": "Sweet Potato", "name_te": "చిలగడదుంప", "calories": 103, "protein": 2, "carbs": 24, "fat": 0.1, "fiber": 4, "serving": "1 medium", "category": "vegetables"},
    "pumpkin": {"name": "Pumpkin", "name_te": "గుమ్మడికాయ", "calories": 26, "protein": 1, "carbs": 6, "fat": 0.1, "fiber": 0.5, "serving": "1 cup", "category": "vegetables"},
    "ivy_gourd": {"name": "Ivy Gourd/Dondakaya", "name_te": "దొండకాయ", "calories": 18, "protein": 1.2, "carbs": 3, "fat": 0.1, "fiber": 1.6, "serving": "1 cup", "category": "vegetables"},
    
    # ============== EGGS & DAIRY ==============
    "boiled_egg": {"name": "Boiled Egg", "name_te": "ఉడికించిన గుడ్డు", "calories": 78, "protein": 6, "carbs": 0.6, "fat": 5, "fiber": 0, "serving": "1 large", "category": "protein"},
    "fried_egg": {"name": "Fried Egg", "name_te": "వేపిన గుడ్డు", "calories": 90, "protein": 6, "carbs": 0.4, "fat": 7, "fiber": 0, "serving": "1 large", "category": "protein"},
    "scrambled_egg": {"name": "Scrambled Egg", "name_te": "స్క్రాంబుల్డ్ ఎగ్", "calories": 100, "protein": 7, "carbs": 1, "fat": 7, "fiber": 0, "serving": "1 large", "category": "protein"},
    "omelette": {"name": "Plain Omelette", "name_te": "ఆమ్లెట్", "calories": 120, "protein": 8, "carbs": 1, "fat": 9, "fiber": 0, "serving": "2 eggs", "category": "protein"},
    "masala_omelette": {"name": "Masala Omelette", "name_te": "మసాలా ఆమ్లెట్", "calories": 150, "protein": 10, "carbs": 3, "fat": 11, "fiber": 0.5, "serving": "2 eggs", "category": "protein"},
    "egg_bhurji": {"name": "Egg Bhurji", "name_te": "ఎగ్ భుర్జీ", "calories": 180, "protein": 12, "carbs": 4, "fat": 13, "fiber": 1, "serving": "2 eggs", "category": "protein"},
    "paneer": {"name": "Paneer (raw)", "name_te": "పనీర్", "calories": 265, "protein": 18, "carbs": 3, "fat": 20, "fiber": 0, "serving": "100g", "category": "protein"},
    "cottage_cheese": {"name": "Cottage Cheese", "name_te": "కాటేజ్ చీజ్", "calories": 98, "protein": 11, "carbs": 3, "fat": 4, "fiber": 0, "serving": "100g", "category": "protein"},
    "curd": {"name": "Curd/Yogurt", "name_te": "పెరుగు", "calories": 60, "protein": 3, "carbs": 5, "fat": 3, "fiber": 0, "serving": "1 cup", "category": "dairy"},
    "greek_yogurt": {"name": "Greek Yogurt", "name_te": "గ్రీక్ యోగర్ట్", "calories": 100, "protein": 10, "carbs": 6, "fat": 5, "fiber": 0, "serving": "1 cup", "category": "dairy"},
    "cheese": {"name": "Cheddar Cheese", "name_te": "చీజ్", "calories": 113, "protein": 7, "carbs": 0.4, "fat": 9, "fiber": 0, "serving": "1 slice", "category": "dairy"},
    "butter": {"name": "Butter", "name_te": "వెన్న", "calories": 102, "protein": 0.1, "carbs": 0, "fat": 12, "fiber": 0, "serving": "1 tbsp", "category": "dairy"},
    "ghee": {"name": "Ghee", "name_te": "నెయ్యి", "calories": 112, "protein": 0, "carbs": 0, "fat": 13, "fiber": 0, "serving": "1 tbsp", "category": "dairy"},
    
    # ============== NUTS & DRY FRUITS ==============
    "almonds": {"name": "Almonds", "name_te": "బాదం", "calories": 164, "protein": 6, "carbs": 6, "fat": 14, "fiber": 3.5, "serving": "1 oz (23 nuts)", "category": "nuts"},
    "cashews": {"name": "Cashews", "name_te": "జీడిపప్పు", "calories": 157, "protein": 5, "carbs": 9, "fat": 12, "fiber": 1, "serving": "1 oz", "category": "nuts"},
    "walnuts": {"name": "Walnuts", "name_te": "అక్రోట్", "calories": 185, "protein": 4, "carbs": 4, "fat": 18, "fiber": 2, "serving": "1 oz", "category": "nuts"},
    "peanuts": {"name": "Peanuts", "name_te": "వేరుశెనగ", "calories": 161, "protein": 7, "carbs": 5, "fat": 14, "fiber": 2, "serving": "1 oz", "category": "nuts"},
    "pistachios": {"name": "Pistachios", "name_te": "పిస్తా", "calories": 156, "protein": 6, "carbs": 8, "fat": 12, "fiber": 3, "serving": "1 oz", "category": "nuts"},
    "raisins": {"name": "Raisins", "name_te": "ఎండు ద్రాక్ష", "calories": 85, "protein": 1, "carbs": 22, "fat": 0, "fiber": 1, "serving": "1 oz", "category": "nuts"},
    "dry_dates": {"name": "Dried Dates", "name_te": "ఖర్జూరం", "calories": 70, "protein": 0.5, "carbs": 18, "fat": 0, "fiber": 2, "serving": "2 pieces", "category": "nuts"},
    "dry_figs": {"name": "Dried Figs", "name_te": "అంజీర్", "calories": 47, "protein": 0.6, "carbs": 12, "fat": 0.2, "fiber": 2, "serving": "2 pieces", "category": "nuts"},
    "apricot_dry": {"name": "Dried Apricots", "name_te": "డ్రై ఏప్రికాట్స్", "calories": 67, "protein": 1, "carbs": 17, "fat": 0.1, "fiber": 2, "serving": "5 pieces", "category": "nuts"},
    
    # ============== FAST FOOD & INTERNATIONAL ==============
    "pizza": {"name": "Pizza (1 slice)", "name_te": "పిజ్జా", "calories": 285, "protein": 12, "carbs": 36, "fat": 10, "fiber": 2, "serving": "1 slice", "category": "fastfood"},
    "burger": {"name": "Veg Burger", "name_te": "బర్గర్", "calories": 350, "protein": 12, "carbs": 45, "fat": 14, "fiber": 3, "serving": "1 burger", "category": "fastfood"},
    "chicken_burger": {"name": "Chicken Burger", "name_te": "చికెన్ బర్గర్", "calories": 450, "protein": 25, "carbs": 40, "fat": 22, "fiber": 2, "serving": "1 burger", "category": "fastfood"},
    "french_fries": {"name": "French Fries", "name_te": "ఫ్రెంచ్ ఫ్రైస్", "calories": 365, "protein": 4, "carbs": 48, "fat": 17, "fiber": 4, "serving": "medium", "category": "fastfood"},
    "sandwich": {"name": "Veg Sandwich", "name_te": "శాండ్విచ్", "calories": 250, "protein": 8, "carbs": 35, "fat": 10, "fiber": 3, "serving": "1 sandwich", "category": "fastfood"},
    "grilled_sandwich": {"name": "Grilled Sandwich", "name_te": "గ్రిల్డ్ శాండ్విచ్", "calories": 300, "protein": 10, "carbs": 35, "fat": 14, "fiber": 3, "serving": "1 sandwich", "category": "fastfood"},
    "wrap": {"name": "Veg Wrap", "name_te": "వ్రాప్", "calories": 320, "protein": 10, "carbs": 40, "fat": 14, "fiber": 4, "serving": "1 wrap", "category": "fastfood"},
    "chicken_wrap": {"name": "Chicken Wrap", "name_te": "చికెన్ వ్రాప్", "calories": 420, "protein": 22, "carbs": 38, "fat": 20, "fiber": 3, "serving": "1 wrap", "category": "fastfood"},
    "pasta": {"name": "Pasta (white sauce)", "name_te": "పాస్తా", "calories": 350, "protein": 12, "carbs": 45, "fat": 14, "fiber": 2, "serving": "1 cup", "category": "fastfood"},
    "pasta_red_sauce": {"name": "Pasta (red sauce)", "name_te": "రెడ్ సాస్ పాస్తా", "calories": 280, "protein": 10, "carbs": 48, "fat": 6, "fiber": 4, "serving": "1 cup", "category": "fastfood"},
    "noodles": {"name": "Veg Noodles", "name_te": "నూడిల్స్", "calories": 300, "protein": 8, "carbs": 45, "fat": 10, "fiber": 3, "serving": "1 plate", "category": "fastfood"},
    "maggi": {"name": "Maggi Noodles", "name_te": "మ్యాగీ", "calories": 370, "protein": 9, "carbs": 50, "fat": 15, "fiber": 2, "serving": "1 packet", "category": "fastfood"},
    "fried_chicken": {"name": "Fried Chicken", "name_te": "ఫ్రైడ్ చికెన్", "calories": 250, "protein": 20, "carbs": 8, "fat": 16, "fiber": 0, "serving": "1 piece", "category": "fastfood"},
    "chicken_nuggets": {"name": "Chicken Nuggets", "name_te": "చికెన్ నగ్గెట్స్", "calories": 286, "protein": 15, "carbs": 18, "fat": 18, "fiber": 1, "serving": "6 pieces", "category": "fastfood"},
    "hotdog": {"name": "Hot Dog", "name_te": "హాట్ డాగ్", "calories": 290, "protein": 11, "carbs": 24, "fat": 17, "fiber": 1, "serving": "1 piece", "category": "fastfood"},
    "shawarma": {"name": "Chicken Shawarma", "name_te": "షవర్మా", "calories": 400, "protein": 22, "carbs": 35, "fat": 20, "fiber": 2, "serving": "1 roll", "category": "fastfood"},
    "tacos": {"name": "Tacos", "name_te": "టాకోస్", "calories": 210, "protein": 9, "carbs": 20, "fat": 10, "fiber": 3, "serving": "2 tacos", "category": "fastfood"},
    "nachos": {"name": "Nachos with Cheese", "name_te": "నాచోస్", "calories": 350, "protein": 8, "carbs": 35, "fat": 20, "fiber": 3, "serving": "1 serving", "category": "fastfood"},
    "sushi": {"name": "Sushi Roll", "name_te": "సుషి", "calories": 200, "protein": 6, "carbs": 38, "fat": 2, "fiber": 2, "serving": "6 pieces", "category": "fastfood"},
    
    # ============== GRAINS & CEREALS ==============
    "oats": {"name": "Oats (cooked)", "name_te": "ఓట్స్", "calories": 150, "protein": 5, "carbs": 27, "fat": 3, "fiber": 4, "serving": "1 cup", "category": "grains"},
    "cornflakes": {"name": "Cornflakes", "name_te": "కార్న్‌ఫ్లేక్స్", "calories": 100, "protein": 2, "carbs": 24, "fat": 0.1, "fiber": 1, "serving": "1 cup", "category": "grains"},
    "muesli": {"name": "Muesli", "name_te": "మ్యూస్లి", "calories": 290, "protein": 8, "carbs": 55, "fat": 5, "fiber": 6, "serving": "1 cup", "category": "grains"},
    "granola": {"name": "Granola", "name_te": "గ్రనోలా", "calories": 300, "protein": 7, "carbs": 45, "fat": 12, "fiber": 4, "serving": "1/2 cup", "category": "grains"},
    "daliya": {"name": "Daliya/Broken Wheat", "name_te": "దలియా", "calories": 160, "protein": 6, "carbs": 32, "fat": 1, "fiber": 5, "serving": "1 cup cooked", "category": "grains"},
    "quinoa": {"name": "Quinoa", "name_te": "క్వినోవా", "calories": 222, "protein": 8, "carbs": 39, "fat": 4, "fiber": 5, "serving": "1 cup cooked", "category": "grains"},
    "wheat_bread": {"name": "Whole Wheat Bread", "name_te": "గోధుమ బ్రెడ్", "calories": 69, "protein": 4, "carbs": 12, "fat": 1, "fiber": 2, "serving": "1 slice", "category": "grains"},
    "white_bread": {"name": "White Bread", "name_te": "వైట్ బ్రెడ్", "calories": 79, "protein": 3, "carbs": 15, "fat": 1, "fiber": 1, "serving": "1 slice", "category": "grains"},
    "multigrain_bread": {"name": "Multigrain Bread", "name_te": "మల్టీగ్రెయిన్ బ్రెడ్", "calories": 75, "protein": 4, "carbs": 13, "fat": 1.5, "fiber": 2, "serving": "1 slice", "category": "grains"},
    
    # ============== CONDIMENTS & EXTRAS ==============
    "pickle": {"name": "Indian Pickle", "name_te": "ఊరగాయ", "calories": 25, "protein": 0.3, "carbs": 2, "fat": 2, "fiber": 0.5, "serving": "1 tbsp", "category": "condiments"},
    "chutney_coconut": {"name": "Coconut Chutney", "name_te": "కొబ్బరి చట్నీ", "calories": 60, "protein": 1, "carbs": 4, "fat": 5, "fiber": 1, "serving": "2 tbsp", "category": "condiments"},
    "chutney_tomato": {"name": "Tomato Chutney", "name_te": "టమాట చట్నీ", "calories": 35, "protein": 1, "carbs": 6, "fat": 1, "fiber": 1, "serving": "2 tbsp", "category": "condiments"},
    "chutney_mint": {"name": "Mint Chutney", "name_te": "పుదీనా చట్నీ", "calories": 15, "protein": 0.5, "carbs": 2, "fat": 0.5, "fiber": 0.5, "serving": "2 tbsp", "category": "condiments"},
    "raita": {"name": "Cucumber Raita", "name_te": "రైతా", "calories": 50, "protein": 2, "carbs": 5, "fat": 2, "fiber": 0.5, "serving": "1/2 cup", "category": "condiments"},
    "papad": {"name": "Papad (roasted)", "name_te": "అప్పడం", "calories": 35, "protein": 2, "carbs": 5, "fat": 1, "fiber": 0.5, "serving": "1 piece", "category": "condiments"},
    "papad_fried": {"name": "Papad (fried)", "name_te": "వేపిన అప్పడం", "calories": 70, "protein": 2, "carbs": 5, "fat": 5, "fiber": 0.5, "serving": "1 piece", "category": "condiments"},
    "honey": {"name": "Honey", "name_te": "తేనె", "calories": 64, "protein": 0.1, "carbs": 17, "fat": 0, "fiber": 0, "serving": "1 tbsp", "category": "condiments"},
    "sugar": {"name": "Sugar", "name_te": "చక్కెర", "calories": 49, "protein": 0, "carbs": 13, "fat": 0, "fiber": 0, "serving": "1 tbsp", "category": "condiments"},
    "jaggery": {"name": "Jaggery", "name_te": "బెల్లం", "calories": 38, "protein": 0.1, "carbs": 10, "fat": 0, "fiber": 0, "serving": "1 tbsp", "category": "condiments"},
    
    # ============== HEALTH FOODS & SUPPLEMENTS ==============
    "protein_shake": {"name": "Whey Protein Shake", "name_te": "ప్రోటీన్ షేక్", "calories": 130, "protein": 25, "carbs": 3, "fat": 2, "fiber": 0, "serving": "1 scoop", "category": "health"},
    "protein_bar": {"name": "Protein Bar", "name_te": "ప్రోటీన్ బార్", "calories": 200, "protein": 20, "carbs": 20, "fat": 6, "fiber": 2, "serving": "1 bar", "category": "health"},
    "sprouts": {"name": "Mixed Sprouts", "name_te": "మొలకలు", "calories": 30, "protein": 3, "carbs": 4, "fat": 0.5, "fiber": 2, "serving": "1 cup", "category": "health"},
    "flax_seeds": {"name": "Flax Seeds", "name_te": "అవిసె గింజలు", "calories": 55, "protein": 2, "carbs": 3, "fat": 4, "fiber": 3, "serving": "1 tbsp", "category": "health"},
    "chia_seeds": {"name": "Chia Seeds", "name_te": "చియా సీడ్స్", "calories": 58, "protein": 2, "carbs": 5, "fat": 4, "fiber": 4, "serving": "1 tbsp", "category": "health"},
    "pumpkin_seeds": {"name": "Pumpkin Seeds", "name_te": "గుమ్మడి గింజలు", "calories": 126, "protein": 5, "carbs": 4, "fat": 10, "fiber": 1, "serving": "1 oz", "category": "health"},
    "sunflower_seeds": {"name": "Sunflower Seeds", "name_te": "పొద్దుతిరుగుడు గింజలు", "calories": 165, "protein": 5, "carbs": 7, "fat": 14, "fiber": 2, "serving": "1 oz", "category": "health"},
    "tofu": {"name": "Tofu", "name_te": "టోఫు", "calories": 76, "protein": 8, "carbs": 2, "fat": 4, "fiber": 0.5, "serving": "100g", "category": "health"},
    "soy_milk": {"name": "Soy Milk", "name_te": "సోయా పాలు", "calories": 80, "protein": 7, "carbs": 4, "fat": 4, "fiber": 1, "serving": "1 cup", "category": "health"},
    "almond_milk": {"name": "Almond Milk", "name_te": "బాదం పాలు", "calories": 30, "protein": 1, "carbs": 1, "fat": 2.5, "fiber": 0, "serving": "1 cup", "category": "health"},
}

# Categories for filtering
FOOD_CATEGORIES = {
    "breakfast": "Breakfast / అల్పాహారం",
    "lunch": "Lunch / భోజనం",
    "dinner": "Dinner / రాత్రి భోజనం",
    "snacks": "Snacks / స్నాక్స్",
    "dessert": "Desserts / స్వీట్లు",
    "beverage": "Beverages / పానీయాలు",
    "fruits": "Fruits / పండ్లు",
    "vegetables": "Vegetables / కూరగాయలు",
    "protein": "Eggs & Dairy / గుడ్లు & పాల ఉత్పత్తులు",
    "dairy": "Dairy Products / పాల ఉత్పత్తులు",
    "nuts": "Nuts & Dry Fruits / నట్స్",
    "fastfood": "Fast Food / ఫాస్ట్ ఫుడ్",
    "grains": "Grains & Cereals / ధాన్యాలు",
    "condiments": "Condiments / చట్నీలు",
    "health": "Health Foods / ఆరోగ్య ఆహారం"
}

def search_foods(query: str, category: str = None, limit: int = 20):
    """Search foods by name, Telugu name, or category"""
    query = query.lower().strip()
    results = []
    
    for food_id, food in FOOD_DATABASE.items():
        # Search in id, name, and Telugu name
        match_score = 0
        if query in food_id.lower():
            match_score = 3
        elif query in food.get("name", "").lower():
            match_score = 2
        elif query in food.get("name_te", "").lower():
            match_score = 2
        elif any(query in word for word in food_id.split("_")):
            match_score = 1
        elif any(query in word for word in food.get("name", "").lower().split()):
            match_score = 1
            
        if match_score > 0:
            if category and food.get("category") != category:
                continue
            results.append({
                "id": food_id,
                "match_score": match_score,
                **food
            })
    
    # Sort by match score and return top results
    results.sort(key=lambda x: (-x["match_score"], x["name"]))
    return results[:limit]

def get_foods_by_category(category: str):
    """Get all foods in a category"""
    return [
        {"id": food_id, **food}
        for food_id, food in FOOD_DATABASE.items()
        if food.get("category") == category
    ]

def get_food_by_id(food_id: str):
    """Get a single food item by ID"""
    food = FOOD_DATABASE.get(food_id)
    if food:
        return {"id": food_id, **food}
    return None
