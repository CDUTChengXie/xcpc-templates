# Voronoi图（指定凸窗口）

站点与窗口坐标有限；window 为非退化凸多边形，按边界顺序给点，可顺/逆时针。 cells[i] 对应站点 sites[i]（下标 [0,n)），重复/距离<=eps 站点共享单元；单元为闭凸集，结果已裁到 window，不输出无界射线。

eps 同 GeoPolygon 绝对判定阈值，窄单元及近重合站点按尺度调整；power 用平方距离减权重（圆幂图）。

最坏 O(n²(w+n))，空间 O(n(w+n))；不是 O(n log n) 的无界 Voronoi 构图。

```cpp
#ifndef XCPC_TEMPLATE_POINT
#define XCPC_TEMPLATE_POINT

template <class T> struct Point {
    T x;
    T y;

    // 构造点/向量，省略坐标得到原点。
    Point(const T &x_ = 0, const T &y_ = 0) : x(x_), y(y_) {}

    // 原地向量运算；标量除数须非零，返回本对象引用。
    Point &operator+=(const Point &p) & {
        x += p.x;
        y += p.y;
        return *this;
    }
    // 原地向量运算；标量除数须非零，返回本对象引用。
    Point &operator-=(const Point &p) & {
        x -= p.x;
        y -= p.y;
        return *this;
    }
    // 原地向量运算；标量除数须非零，返回本对象引用。
    Point &operator*=(const T &v) & {
        x *= v;
        y *= v;
        return *this;
    }
    // 原地向量运算；标量除数须非零，返回本对象引用。
    Point &operator/=(const T &v) & {
        x /= v;
        y /= v;
        return *this;
    }
    // 返回反向向量。
    Point operator-() const {
        return Point(-x, -y);
    }
    // 返回两向量之和。
    friend Point operator+(Point a, const Point &b) {
        return a += b;
    }
    // 返回两向量之差。
    friend Point operator-(Point a, const Point &b) {
        return a -= b;
    }
    // 返回标量倍向量。
    friend Point operator*(Point a, const T &b) {
        return a *= b;
    }
    // 返回向量除以非零标量。
    friend Point operator/(Point a, const T &b) {
        return a /= b;
    }
    // 返回标量左乘向量。
    friend Point operator*(const T &a, Point b) {
        return b *= a;
    }
    // 返回坐标严格相等，不含 eps。
    friend bool operator==(const Point &a, const Point &b) {
        return a.x == b.x && a.y == b.y;
    }
    // 返回字典序比较（先 x 后 y），不含 eps。
    friend bool operator<(const Point &a, const Point &b) {
        return a.x < b.x || (a.x == b.x && a.y < b.y);
    }
    // 读入 x、y，返回输入流。
    friend std::istream &operator>>(std::istream &is, Point &p) {
        return is >> p.x >> p.y;
    }
    // 输出 x、y，返回输出流。
    friend std::ostream &operator<<(std::ostream &os, const Point &p) {
        return os << p.x << " " << p.y;
    }
};

template <class T> struct Line {
    Point<T> a;
    Point<T> b;

    // 构造有向线段端点；直线运算须保证两端点不同。
    Line(const Point<T> &a_ = Point<T>(), const Point<T> &b_ = Point<T>()) : a(a_), b(b_) {}
};

template <class T>
// 返回两向量点积。
T dot(const Point<T> &a, const Point<T> &b) {
    return a.x * b.x + a.y * b.y;
}

template <class T>
// 返回两向量二维叉积（a 到 b 逆时针为正）。
T cross(const Point<T> &a, const Point<T> &b) {
    return a.x * b.y - a.y * b.x;
}

template <class T>
// 返回向量长度平方。
T square(const Point<T> &p) {
    return dot(p, p);
}

template <class T>
// 返回向量长度，结果为 double。
double length(const Point<T> &p) {
    return std::sqrt(square(p));
}

template <class T>
// 返回两点距离，结果为 double。
double distance(const Point<T> &a, const Point<T> &b) {
    return length(a - b);
}

template <class T>
// 返回点到直线距离；两端点须不同。
double distancePL(const Point<T> &p, const Line<T> &l) {
    return std::abs(cross(l.a - l.b, l.a - p)) / length(l.b - l.a);
}

template <class T>
// 返回点到闭线段距离；端点须不同，零长段会除零。
double distancePS(const Point<T> &p, const Line<T> &l) {
    if (dot(p - l.a, l.b - l.a) < 0) {
        return distance(p, l.a);
    }
    if (dot(p - l.b, l.a - l.b) < 0) {
        return distance(p, l.b);
    }
    return distancePL(p, l);
}

template <class T>
// 返回两非平行直线交点；整数类型用 long double 计算后截断，精度场景改用浮点坐标。
Point<T> lineIntersection(const Line<T> &l1, const Line<T> &l2) {
    long double c1 = (long double)cross(l2.b - l2.a, l1.a - l2.a);
    long double c2 = (long double)cross(l2.b - l2.a, l1.a - l1.b);
    long double t = c1 / c2;
    return Point<T>(l1.a.x + (long double)(l1.b.x - l1.a.x) * t,
                    l1.a.y + (long double)(l1.b.y - l1.a.y) * t);
}

template <class T>
// 判断点是否在闭线段上（含端点；浮点需自行加 eps）。
bool pointOnSegment(const Point<T> &p, const Line<T> &l) {
    return cross(p - l.a, l.b - l.a) == 0 && std::min(l.a.x, l.b.x) <= p.x &&
           p.x <= std::max(l.a.x, l.b.x) && std::min(l.a.y, l.b.y) <= p.y &&
           p.y <= std::max(l.a.y, l.b.y);
}

template <class T>
// 判断点是否在简单多边形闭区域内（边界算内，与绕向无关，O(n)）。
bool pointInPolygon(const Point<T> &a, const std::vector<Point<T>> &p) {
    int n = p.size();
    for (int i = 0; i < n; i++) {
        if (pointOnSegment(a, Line(p[i], p[(i + 1) % n]))) {
            return true;
        }
    }
    int t = 0;
    for (int i = 0; i < n; i++) {
        auto u = p[i];
        auto v = p[(i + 1) % n];
        if (u.x < a.x && v.x >= a.x && cross(v - u, a - u) > 0) {
            t ^= 1;
        }
        if (u.x >= a.x && v.x < a.x && cross(u - v, a - v) > 0) {
            t ^= 1;
        }
    }
    return t == 1;
}

template <class T>
// 返回两闭线段相交分类：0 不相交、1 严格相交、2 重叠（返回两端点）、3 端点相交。
std::tuple<int, Point<T>, Point<T>> segmentIntersection(const Line<T> &l1, const Line<T> &l2) {
    if (l1.a == l1.b)
        return {pointOnSegment(l1.a, l2) ? 3 : 0, l1.a, l1.a};
    if (l2.a == l2.b)
        return {pointOnSegment(l2.a, l1) ? 3 : 0, l2.a, l2.a};
    if (std::max(l1.a.x, l1.b.x) < std::min(l2.a.x, l2.b.x) ||
        std::min(l1.a.x, l1.b.x) > std::max(l2.a.x, l2.b.x) ||
        std::max(l1.a.y, l1.b.y) < std::min(l2.a.y, l2.b.y) ||
        std::min(l1.a.y, l1.b.y) > std::max(l2.a.y, l2.b.y)) {
        return {0, Point<T>(), Point<T>()};
    }
    if (cross(l1.b - l1.a, l2.b - l2.a) == 0) {
        if (cross(l1.b - l1.a, l2.a - l1.a) != 0) {
            return {0, Point<T>(), Point<T>()};
        }
        Point<T> p1(std::max(std::min(l1.a.x, l1.b.x), std::min(l2.a.x, l2.b.x)),
                    std::max(std::min(l1.a.y, l1.b.y), std::min(l2.a.y, l2.b.y)));
        Point<T> p2(std::min(std::max(l1.a.x, l1.b.x), std::max(l2.a.x, l2.b.x)),
                    std::min(std::max(l1.a.y, l1.b.y), std::max(l2.a.y, l2.b.y)));
        if (!pointOnSegment(p1, l1)) {
            std::swap(p1.y, p2.y);
        }
        if (p1 == p2) {
            return {3, p1, p2};
        }
        return {2, p1, p2};
    }
    auto cp1 = cross(l2.a - l1.a, l2.b - l1.a);
    auto cp2 = cross(l2.a - l1.b, l2.b - l1.b);
    auto cp3 = cross(l1.a - l2.a, l1.b - l2.a);
    auto cp4 = cross(l1.a - l2.b, l1.b - l2.b);
    if ((cp1 > 0 && cp2 > 0) || (cp1 < 0 && cp2 < 0) || (cp3 > 0 && cp4 > 0) ||
        (cp3 < 0 && cp4 < 0)) {
        return {0, Point<T>(), Point<T>()};
    }
    Point p = lineIntersection(l1, l2);
    if (cp1 != 0 && cp2 != 0 && cp3 != 0 && cp4 != 0) {
        return {1, p, p};
    }
    return {3, p, p};
}

template <class T>
// 返回两闭线段最短距离，相交或重叠为 0。
double distanceSS(const Line<T> &l1, const Line<T> &l2) {
    if (std::get<0>(segmentIntersection(l1, l2)) != 0) {
        return 0.0;
    }
    return std::min(
        {distancePS(l1.a, l2), distancePS(l1.b, l2), distancePS(l2.a, l1), distancePS(l2.b, l1)});
}

template <class T>
// 返回简单多边形两倍无向面积，顶点须按边界顺序；空集或单点返回 0。
T polygonArea2(const std::vector<Point<T>> &p) {
    T s = 0;
    int n = p.size();
    for (int i = 0; i < n; i++) {
        s += cross(p[i], p[(i + 1) % n]);
    }
    return std::abs(s);
}

#endif // XCPC_TEMPLATE_POINT

#ifndef XCPC_GEOMETRY_POLYGON_EXTRA
#define XCPC_GEOMETRY_POLYGON_EXTRA
namespace GeoPolygon {
    using Real = long double;
    using P = Point<Real>;
    namespace detail {
        int sign(Real x, Real eps) {
            return x > eps ? 1 : x < -eps ? -1 : 0;
        }
        bool near(P a, P b, Real eps) {
            return square(a - b) <= eps * eps;
        }
        bool on(P q, P a, P b, Real eps) {
            return std::abs(cross(b - a, q - a)) <= eps && dot(q - a, q - b) <= eps;
        }
        std::vector<P> clean(std::vector<P> p, Real eps) {
            std::vector<P> q;
            for (P v : p)
                if (q.empty() || !near(q.back(), v, eps))
                    q.push_back(v);
            if (q.size() > 1 && near(q.front(), q.back(), eps))
                q.pop_back();
            return q;
        }
    }
    // 边界顺序给点；返回有向面积，逆时针为正，少于三点为零。
    Real signedArea(const std::vector<P> &p) {
        Real s = 0;
        if (p.empty())
            return 0;
        for (int i = 1; i + 1 < int(p.size()); ++i)
            s += cross(p[i] - p[0], p[i + 1] - p[0]);
        return s / 2;
    }
    // 简单多边形点定位；返回 0 外部、1 边界、2 内部，允许顺/逆时针和连续重复点。
    int locate(const std::vector<P> &p, P q, Real eps = 1e-12L) {
        bool in = false;
        int n = int(p.size());
        for (int i = 0; i < n; ++i) {
            P a = p[i], b = p[(i + 1) % n];
            if (detail::on(q, a, b, eps))
                return 1;
            if ((a.y > q.y) != (b.y > q.y)) {
                Real c = cross(b - a, q - a);
                if ((b.y > a.y && c > 0) || (b.y < a.y && c < 0))
                    in = !in;
            }
        }
        return in ? 2 : 0;
    }
    // 严格凸 CCW 多边形点定位，O(log n)；0/1/2 表示外/边/内，0/1/2 个顶点也支持。
    int locateConvex(const std::vector<P> &p, P q, Real eps = 1e-12L) {
        int n = int(p.size());
        if (n < 3)
            return locate(p, q, eps);
        Real a = cross(p[1] - p[0], q - p[0]), b = cross(p.back() - p[0], q - p[0]);
        if (a < -eps || b > eps)
            return 0;
        if (std::abs(a) <= eps)
            return detail::on(q, p[0], p[1], eps) ? 1 : 0;
        if (std::abs(b) <= eps)
            return detail::on(q, p[0], p.back(), eps) ? 1 : 0;
        int l = 1, r = n - 1;
        while (r - l > 1) {
            int m = (l + r) / 2;
            if (cross(p[m] - p[0], q - p[0]) >= 0)
                l = m;
            else
                r = m;
        }
        Real c = cross(p[r] - p[l], q - p[l]);
        return c < -eps ? 0 : std::abs(c) <= eps ? 1 : 2;
    }
    // 保留有向直线 a->b 的闭左侧；凸多边形须 CCW，结果可为空、点、线段，无重复首尾点。
    std::vector<P> cut(const std::vector<P> &p, P a, P b, Real eps = 1e-12L) {
        if (square(b - a) == 0)
            throw std::invalid_argument("cut: zero direction");
        std::vector<P> out;
        int n = int(p.size());
        for (int i = 0; i < n; ++i) {
            P u = p[i], v = p[(i + 1) % n];
            Real x = cross(b - a, u - a), y = cross(b - a, v - a);
            int sx = detail::sign(x, eps), sy = detail::sign(y, eps);
            if (sx >= 0)
                out.push_back(u);
            if (sx * sy < 0)
                out.push_back(u + (v - u) * (x / (x - y)));
        }
        return detail::clean(out, eps);
    }
    // 两个闭凸集求交；多边形须 CCW、无重复首尾，允许空/点/段；返回边界顶点。
    std::vector<P> intersect(std::vector<P> p, std::vector<P> q, Real eps = 1e-12L) {
        p = detail::clean(p, eps);
        q = detail::clean(q, eps);
        if (p.empty() || q.empty())
            return {};
        if (q.size() < 3 && p.size() >= 3)
            std::swap(p, q);
        if (q.size() >= 3) {
            for (int i = 0; i < int(q.size()) && !p.empty(); ++i)
                p = cut(p, q[i], q[(i + 1) % q.size()], eps);
            return p;
        }
        if (p.size() == 1)
            return locate(q, p[0], eps) ? p : std::vector<P>{};
        if (q.size() == 1)
            return locate(p, q[0], eps) ? q : std::vector<P>{};
        P a = p[0], b = p[1], c = q[0], d = q[1];
        Real den = cross(b - a, d - c);
        if (std::abs(den) > eps) {
            Real t = cross(c - a, d - c) / den, u = cross(c - a, b - a) / den;
            return t >= -eps && t <= 1 + eps && u >= -eps && u <= 1 + eps
                       ? std::vector<P>{a + (b - a) * std::clamp(t, Real(0), Real(1))}
                       : std::vector<P>{};
        }
        std::vector<P> out;
        for (P x : std::vector<P>{a, b, c, d})
            if (detail::on(x, a, b, eps) && detail::on(x, c, d, eps))
                out.push_back(x);
        std::sort(out.begin(), out.end());
        out = detail::clean(out, eps);
        if (out.size() > 2)
            out = {out.front(), out.back()};
        return out;
    }
    namespace detail {
        std::vector<Real> segmentParameters(const std::vector<P> &p, P a, P b, Real eps) {
            P d = b - a;
            Real len2 = square(d);
            std::vector<Real> ts{0, 1};
            if (len2 <= eps * eps)
                return ts;
            for (int i = 0; i < int(p.size()); ++i) {
                P u = p[i], v = p[(i + 1) % p.size()], e = v - u;
                Real den = cross(d, e);
                if (std::abs(den) > eps) {
                    Real t = cross(u - a, e) / den, s = cross(u - a, d) / den;
                    if (t >= -eps && t <= 1 + eps && s >= -eps && s <= 1 + eps)
                        ts.push_back(std::clamp(t, Real(0), Real(1)));
                } else if (std::abs(cross(d, u - a)) <= eps) {
                    ts.push_back(std::clamp(dot(u - a, d) / len2, Real(0), Real(1)));
                    ts.push_back(std::clamp(dot(v - a, d) / len2, Real(0), Real(1)));
                }
            }
            std::sort(ts.begin(), ts.end());
            ts.erase(
                std::unique(ts.begin(), ts.end(), [&](Real x, Real y) { return y - x <= eps; }),
                ts.end());
            return ts;
        }
    }
    // 整条闭线段 a-b 是否在简单多边形闭区域；凹口、沿边、擦顶点及零长段均支持。
    bool containsSegment(const std::vector<P> &p, P a, P b, Real eps = 1e-12L) {
        if (!locate(p, a, eps) || !locate(p, b, eps))
            return false;
        P d = b - a;
        if (square(d) <= eps * eps)
            return true;
        auto ts = detail::segmentParameters(p, a, b, eps);
        // ponytail: O(n) 分段后各做 O(n) 定位，总计 O(n²)；大数据改事件扫描绕数。
        for (int i = 1; i < int(ts.size()); ++i)
            if (!locate(p, a + d * ((ts[i] + ts[i - 1]) / 2), eps))
                return false;
        return true;
    }
    // 有限线段切开无洞简单多边形后的连通块数；沿边不算切开，段端在内部不产生完整切口。
    int cutParts(const std::vector<P> &p, P a, P b, Real eps = 1e-12L) {
        if (p.size() < 3 || std::abs(signedArea(p)) <= eps)
            return 0;
        if (square(b - a) <= eps * eps)
            return 1;
        auto ts = detail::segmentParameters(p, a, b, eps);
        int parts = 1;
        P d = b - a;
        for (int i = 1; i < int(ts.size()); ++i) {
            P u = a + d * ts[i - 1], v = a + d * ts[i];
            if (locate(p, (u + v) / Real(2), eps) == 2 && locate(p, u, eps) == 1 &&
                locate(p, v, eps) == 1)
                ++parts;
        }
        return parts;
    }
}
#endif

namespace VoronoiWindow {
    using P = GeoPolygon::P;
    using Real = long double;
    // 加权 power diagram：最小化 |x-sites[i]|²-weights[i]；重复位置较小权重站点单元为空。
    std::vector<std::vector<P>> power(const std::vector<P> &sites, const std::vector<Real> &weights,
                                      std::vector<P> window, Real eps = 1e-12L) {
        if (weights.size() != sites.size())
            throw std::invalid_argument("weight count mismatch");
        for (Real w : weights)
            if (!std::isfinite(w))
                throw std::invalid_argument("nonfinite weight");
        for (P p : sites)
            if (!std::isfinite(p.x) || !std::isfinite(p.y))
                throw std::invalid_argument("nonfinite site");
        for (P p : window)
            if (!std::isfinite(p.x) || !std::isfinite(p.y))
                throw std::invalid_argument("nonfinite window");
        window = GeoPolygon::detail::clean(window, eps);
        Real area = GeoPolygon::signedArea(window);
        if (window.size() < 3 || std::abs(area) <= eps)
            throw std::invalid_argument("degenerate window");
        if (area < 0)
            std::reverse(window.begin(), window.end());
        for (int i = 0; i < int(window.size()); ++i)
            if (cross(window[(i + 1) % window.size()] - window[i],
                      window[(i + 2) % window.size()] - window[(i + 1) % window.size()]) < -eps)
                throw std::invalid_argument("nonconvex window");
        std::vector<std::vector<P>> cells(sites.size(), window);
        // ponytail: 逐点逐线裁切的最坏上界 O(n³+n²w)；大数据用 Delaunay 邻接约束或专用 Voronoi 构图。
        for (int i = 0; i < int(sites.size()); ++i)
            for (int j = 0; j < int(sites.size()) && !cells[i].empty(); ++j) {
                if (i == j)
                    continue;
                P d = sites[j] - sites[i];
                Real len2 = square(d);
                if (len2 <= eps * eps) {
                    if (weights[i] < weights[j] - eps)
                        cells[i].clear();
                    continue;
                }
                P mid = sites[i] + d * ((len2 + weights[i] - weights[j]) / (2 * len2)),
                  dir{-d.y, d.x};
                cells[i] = GeoPolygon::cut(cells[i], mid, mid + dir, eps);
            }
        return cells;
    }
    // 输入站点和凸窗口；零权重 Voronoi，返回相同顺序的窗口内闭单元，重复站点不去重。
    std::vector<std::vector<P>> build(const std::vector<P> &sites, std::vector<P> window,
                                      Real eps = 1e-12L) {
        return power(sites, std::vector<Real>(sites.size()), std::move(window), eps);
    }
}
```
