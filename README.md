# maxonaute
Booking your tgvmax™ ticket without waiting

## installation

```
$> git clone --recurse-submodules https://github.com/panaC/maxonaute.git
```

## how to use

## tree

# under the hood

## front

![login](https://github.com/panaC/max-front-vue/blob/7c3ddaa344e08b599d18c6b0db74b34f32f06baa/img/login.png)
![booking](https://github.com/panaC/max-front-vue/blob/7c3ddaa344e08b599d18c6b0db74b34f32f06baa/img/booking.png)
![ticket](https://github.com/panaC/max-front-vue/blob/7c3ddaa344e08b599d18c6b0db74b34f32f06baa/img/ticket.png)
![account](https://github.com/panaC/max-front-vue/blob/7c3ddaa344e08b599d18c6b0db74b34f32f06baa/img/account.png)

## max-book

Microservice that call back-end api tickets and check for each of them if a seat is available on ticket

there are 2 directories :
  - check : run every minutes the discovery of new seat available on prefered journeys and then send to MQ.
  - book : runs on MQ, wait a new booking order from 'check' and scrap sncf website

  ![max-book](img/max-book.png)
