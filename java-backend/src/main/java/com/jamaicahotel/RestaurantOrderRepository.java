package com.jamaicahotel;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jamaicahotel.model.RestaurantOrder;

public interface RestaurantOrderRepository extends JpaRepository<RestaurantOrder, Long> {
    List<RestaurantOrder> findAllByOrderByCreatedAtDesc();
}
