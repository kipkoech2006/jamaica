package com.jamaicahotel;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.jamaicahotel.model.MenuItem;
import com.jamaicahotel.model.OrderItem;
import com.jamaicahotel.model.OrderStatus;
import com.jamaicahotel.model.RestaurantOrder;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class OrderController {

    private final MenuItemRepository menuItemRepository;
    private final RestaurantOrderRepository orderRepository;

    public OrderController(MenuItemRepository menuItemRepository, RestaurantOrderRepository orderRepository) {
        this.menuItemRepository = menuItemRepository;
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public List<RestaurantOrder> getOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public RestaurantOrder createOrder(@RequestBody CreateOrderRequest request) {
        if (request == null || request.customerName() == null || request.customerName().isBlank()
                || request.phoneNumber() == null || request.phoneNumber().isBlank()
                || request.orderType() == null || request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer details and at least one item are required.");
        }

        String orderType = request.orderType().trim().toUpperCase(Locale.ROOT);
        if (!orderType.equals("TABLE") && !orderType.equals("DELIVERY")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order type must be TABLE or DELIVERY.");
        }
        if (orderType.equals("TABLE") && (request.tableNumber() == null || request.tableNumber().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A table number is required for dine-in orders.");
        }
        if (orderType.equals("DELIVERY") && (request.deliveryAddress() == null || request.deliveryAddress().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A delivery address is required for delivery orders.");
        }

        List<OrderItem> items = new ArrayList<>();
        for (CreateOrderItemRequest requestedItem : request.items()) {
            if (requestedItem == null || requestedItem.menuItemId() == null
                    || requestedItem.quantity() == null || requestedItem.quantity() < 1 || requestedItem.quantity() > 99) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each item needs a valid menu item and quantity.");
            }

            MenuItem menuItem = menuItemRepository.findById(requestedItem.menuItemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "A requested menu item was not found."));
            items.add(new OrderItem(
                menuItem.getId(),
                menuItem.getName(),
                menuItem.getCategory(),
                menuItem.getPrice(),
                requestedItem.quantity()
            ));
        }

        RestaurantOrder order = new RestaurantOrder();
        order.setCustomerName(request.customerName().trim());
        order.setPhoneNumber(request.phoneNumber().trim());
        order.setOrderType(orderType);
        order.setTableNumber(orderType.equals("TABLE") ? request.tableNumber().trim() : null);
        order.setDeliveryAddress(orderType.equals("DELIVERY") ? request.deliveryAddress().trim() : null);
        order.setNotes(request.notes());
        order.setLatitude(request.latitude());
        order.setLongitude(request.longitude());
        order.setItems(items);
        return orderRepository.save(order);
    }

    @PutMapping("/{id}/status")
    public RestaurantOrder updateStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request) {
        RestaurantOrder order = orderRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));
        if (request == null || request.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An order status is required.");
        }

        try {
            order.setStatus(OrderStatus.valueOf(request.status().trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported order status.", error);
        }
        return orderRepository.save(order);
    }

    public record CreateOrderRequest(
        String customerName,
        String phoneNumber,
        String orderType,
        String tableNumber,
        String deliveryAddress,
        String notes,
        Double latitude,
        Double longitude,
        List<CreateOrderItemRequest> items
    ) {
    }

    public record CreateOrderItemRequest(Long menuItemId, Integer quantity) {
    }

    public record StatusUpdateRequest(String status) {
    }
}
