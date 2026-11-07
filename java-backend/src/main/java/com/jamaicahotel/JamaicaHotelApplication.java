package com.jamaicahotel;

import java.util.List;
import java.util.Map;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.jamaicahotel.model.MenuItem;

@SpringBootApplication
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class JamaicaHotelApplication {

    private final MenuItemRepository menuItemRepository;

    public JamaicaHotelApplication(MenuItemRepository menuItemRepository) {
        this.menuItemRepository = menuItemRepository;
    }

    public static void main(String[] args) {
        SpringApplication.run(JamaicaHotelApplication.class, args);
    }

    // Pre-populate database on startup
    @Bean
    CommandLineRunner initDatabase(MenuItemRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(new MenuItem("Kenyan Mixed Tea (Chai ya Maziwa)", 50.0, "Breakfast", "Rich brewed tea with hot fresh milk"));
                repository.save(new MenuItem("Black Tea / Lemon Tea", 40.0, "Breakfast", "Freshly brewed tea with optional ginger or lemon"));
                repository.save(new MenuItem("Uji Power (Special Porridge)", 80.0, "Breakfast", "Fermented millet/sorghum porridge with milk & nuts"));
                repository.save(new MenuItem("Mandazi / Mahamri (2 pcs)", 30.0, "Breakfast", "Soft, freshly fried golden pastries"));
                repository.save(new MenuItem("Soft Layered Chapati (1 pc)", 30.0, "Breakfast", "Flaky, soft handmade flatbread"));
                repository.save(new MenuItem("Beef Samosa / Veg Samosa (1 pc)", 40.0, "Breakfast", "Crispy pastry triangle filled with minced beef or herbs"));
                repository.save(new MenuItem("Smokie Pasua", 50.0, "Breakfast", "Smokie served with fresh Kachumbari salsa"));
                repository.save(new MenuItem("Boiled Egg (Pasua)", 40.0, "Breakfast", "Hard-boiled egg served with Kachumbari"));
                repository.save(new MenuItem("Spanish Omelette (2 Eggs)", 100.0, "Breakfast", "Fluffy eggs fried with diced tomatoes & onions"));
                repository.save(new MenuItem("Stewed Beef (Inyama Fry/Stew)", 250.0, "Main Meal", "Served with Ugali, Rice, Chapati, or Mukimo"));
                repository.save(new MenuItem("Fried Matumbo (Tripe)", 200.0, "Main Meal", "Tender tripe cooked with onions, tomatoes & coriander"));
                repository.save(new MenuItem("Kienyeji Chicken Stew", 380.0, "Main Meal", "Organic chicken slow-cooked in rich onion & coriander gravy"));
                repository.save(new MenuItem("Wet/Dry Fry Fish (Whole Tilapia)", 450.0, "Main Meal", "Fresh Lake Tilapia served with Ugali & traditional greens"));
                repository.save(new MenuItem("Omena Fry", 180.0, "Main Meal", "Crispy pan-fried omena in tomato gravy"));
                repository.save(new MenuItem("Special Mukimo", 150.0, "Traditional", "Mashed potatoes, green maize, pumpkin leaves & butter"));
                repository.save(new MenuItem("Yellow Beans / Ndengu Stew", 120.0, "Traditional", "Slow-cooked yellow beans or green grams in rich coconut curry"));
                repository.save(new MenuItem("Githeri Special", 120.0, "Traditional", "Boiled corn & beans fried with onions, potatoes & tomatoes"));
                repository.save(new MenuItem("Vegetable Rice / Pilau Ya Mboga", 150.0, "Traditional", "Spiced fragrant rice cooked with minji (green peas)"));
                repository.save(new MenuItem("Ugali Sukuma / Spinach", 100.0, "Traditional", "White cornmeal staple served with braised greens"));
                repository.save(new MenuItem("Chips Plain", 120.0, "Snack", "Crispy golden hand-cut potato fries"));
                repository.save(new MenuItem("Chips Masala", 160.0, "Snack", "Potato fries tossed in hot chili tomato sauce & coriander"));
                repository.save(new MenuItem("Viazi Karai / Bhajia", 150.0, "Snack", "Batter-dipped seasoned potato slices with dip"));
                repository.save(new MenuItem("Beef Kebab", 100.0, "Snack", "Savory minced beef roll, breaded and crispy-fried"));
                repository.save(new MenuItem("Smocha Special", 80.0, "Snack", "Smokie wrapped in a soft chapati with Kachumbari sauce"));
                repository.save(new MenuItem("Fresh Passion / Mango Juice", 80.0, "Cold Refreshment", "Glass of chilled real fruit juice"));
                repository.save(new MenuItem("Cold Soda", 60.0, "Cold Refreshment", "300ml bottle (Coca-Cola, Fanta, Sprite, Krest)"));
                repository.save(new MenuItem("Mineral Water", 50.0, "Cold Refreshment", "500ml bottle"));
                repository.save(new MenuItem("Maziwa Mala (Sour Milk)", 70.0, "Cold Refreshment", "Glass of cold traditional fermented milk"));
                System.out.println("--> Kenyan restaurant menu seeded successfully!");
            }
        };
    }

    @GetMapping("/status")
    public Map<String, String> getStatus() {
        return Map.of("system", "Jamaica Hotel and Restaurant API", "status", "Active");
    }

    // Fetch directly from the SQL Database
    @GetMapping("/menu")
    public List<MenuItem> getMenu() {
        return menuItemRepository.findAll();
    }

    // Add new menu item to Database
    @PostMapping("/menu")
    public MenuItem addMenuItem(@RequestBody MenuItem newItem) {
        return menuItemRepository.save(newItem);
    }

    @GetMapping("/analytics/predict-wait-time")
    public String getWaitTimePrediction(@RequestParam int ordersInQueue) {
        RestTemplate restTemplate = new RestTemplate();
        String pythonUrl = "http://localhost:8000/predict?orders=" + ordersInQueue;
        return restTemplate.getForObject(pythonUrl, String.class);
    }
}