package com.jamaicahotel;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jamaicahotel.model.MenuItem;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
}
