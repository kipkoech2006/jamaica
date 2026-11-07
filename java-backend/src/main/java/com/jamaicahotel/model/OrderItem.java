package com.jamaicahotel.model;

import jakarta.persistence.Embeddable;

@Embeddable
public class OrderItem {

    private Long menuItemId;
    private String name;
    private String category;
    private Double price;
    private Integer quantity;

    public OrderItem() {
    }

    public OrderItem(Long menuItemId, String name, String category, Double price, Integer quantity) {
        this.menuItemId = menuItemId;
        this.name = name;
        this.category = category;
        this.price = price;
        this.quantity = quantity;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public Double getPrice() {
        return price;
    }

    public Integer getQuantity() {
        return quantity;
    }
}
